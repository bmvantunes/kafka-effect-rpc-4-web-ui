import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer as createNetServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as NodeSocket from "@effect/platform-node/NodeSocket";
import { Duration, Effect, Queue } from "effect";
import * as Layer from "effect/Layer";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { KafkaConfig, type KafkaConfigShape } from "../../src/config/kafka-config";
import { provideKafkaRuntime } from "../../src/layers/kafka-runtime";
import {
  HeartbeatRpcGroup,
  type HeartbeatEvent,
  type HeartbeatServerStatus,
  type HeartbeatSnapshotEvent
} from "../../src/rpc/heartbeat-rpc";
import { KafkaAdminService } from "../../src/services/kafka-admin-service";
import { KafkaProducerService } from "../../src/services/kafka-producer-service";
import * as HeartbeatStoreModule from "../../web-ui/lib/heartbeat-store";
import type { HeartbeatStore } from "../../web-ui/lib/heartbeat-store";

const heartbeatStoreNamespace =
  HeartbeatStoreModule as typeof import("../../web-ui/lib/heartbeat-store") & {
    readonly default?: typeof import("../../web-ui/lib/heartbeat-store");
  };

const makeHeartbeatStore =
  heartbeatStoreNamespace.makeHeartbeatStore ??
  heartbeatStoreNamespace.default?.makeHeartbeatStore;

if (!makeHeartbeatStore) {
  throw new Error("failed to load makeHeartbeatStore from web-ui/lib/heartbeat-store");
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_INTERVAL_MS = 100;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const FORCE_KILL_TIMEOUT_MS = 5_000;
const MAX_LOG_LINES = 200;

export interface StartedHeartbeatServer {
  readonly config: KafkaConfigShape;
  readonly baseUrl: string;
  readonly wsUrl: string;
  readonly stop: () => Promise<void>;
}

export interface TestHeartbeatPayload {
  readonly timestamp: number;
  readonly system: string;
  readonly region: string;
}

interface ChildExitResult {
  readonly code: number | null;
  readonly signal: NodeJS.Signals | null;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const nodeRpcClientLayer = (wsUrl: string) =>
  RpcClient.layerProtocolSocket().pipe(
    Layer.provideMerge(NodeSocket.layerWebSocket(wsUrl)),
    Layer.provideMerge(RpcSerialization.layerJson)
  );

const configLayer = (config: KafkaConfigShape) =>
  Layer.succeed(KafkaConfig)(config);

const withTimeout = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  description: string,
  duration: Duration.Input = "5 seconds"
) =>
  effect.pipe(
    Effect.timeoutOrElse({
      duration,
      onTimeout: () => Effect.fail(new Error(`Timed out waiting for ${description}`))
    })
  );

const formatChildExit = (result: ChildExitResult) =>
  `code=${result.code ?? "null"} signal=${result.signal ?? "null"}`;

const formatCapturedLogs = (logs: ReadonlyArray<string>) =>
  logs.length === 0
    ? "no consumer logs captured"
    : logs.slice(-60).join("\n");

const captureChildOutput = (
  child: ChildProcess,
  streamName: "stdout" | "stderr",
  logs: Array<string>
) => {
  const stream = child[streamName];

  if (!stream) {
    return;
  }

  stream.setEncoding("utf8");
  stream.on("data", (chunk: string) => {
    const lines = chunk
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      logs.push(`[${streamName}] ${line}`);
    }

    if (logs.length > MAX_LOG_LINES) {
      logs.splice(0, logs.length - MAX_LOG_LINES);
    }
  });
};

const getChildExitState = (child: ChildProcess): ChildExitResult | undefined => {
  if (child.exitCode === null && child.signalCode === null) {
    return undefined;
  }

  return {
    code: child.exitCode,
    signal: child.signalCode
  };
};

const waitForChildExit = async (
  exitPromise: Promise<ChildExitResult>,
  timeoutMs: number
): Promise<ChildExitResult | undefined> =>
  Promise.race([
    exitPromise,
    sleep(timeoutMs).then(() => undefined)
  ]);

const stopChildProcess = async (
  child: ChildProcess,
  exitPromise: Promise<ChildExitResult>
): Promise<void> => {
  const exited = getChildExitState(child);
  if (exited) {
    await exitPromise;
    return;
  }

  child.kill("SIGTERM");

  const gracefulExit = await waitForChildExit(exitPromise, SHUTDOWN_TIMEOUT_MS);
  if (gracefulExit) {
    return;
  }

  child.kill("SIGKILL");

  const forcedExit = await waitForChildExit(exitPromise, FORCE_KILL_TIMEOUT_MS);
  if (!forcedExit) {
    throw new Error("Timed out waiting for consumer process shutdown");
  }
};

const assertChildStillRunning = (
  child: ChildProcess,
  logs: ReadonlyArray<string>
) => {
  const exitState = getChildExitState(child);
  if (!exitState) {
    return;
  }

  throw new Error(
    `consumer process exited before becoming ready (${formatChildExit(exitState)})\n${formatCapturedLogs(logs)}`
  );
};

const makeChildEnvironment = (config: KafkaConfigShape) => ({
  ...process.env,
  KAFKA_BROKERS: config.brokers.join(","),
  KAFKA_TOPIC: config.topic,
  KAFKA_GROUP_ID: config.groupId,
  KAFKA_CLIENT_ID: config.clientId,
  KAFKA_RPC_WS_PORT: String(config.rpcWsPort),
  KAFKA_RPC_WS_PATH: config.rpcWsPath,
  KAFKA_STRICT_ENV: "false",
  KAFKA_TELEMETRY_EXPORTER: "console"
});

export const findAvailablePort = async (): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.once("listening", () => {
      const address = server.address();

      if (address === null || typeof address === "string") {
        server.close((error) => {
          reject(error ?? new Error("failed to resolve an ephemeral port"));
        });
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
    server.listen(0, "127.0.0.1");
  });

export const makeTestKafkaConfig = async (
  overrides: Partial<KafkaConfigShape> = {}
): Promise<KafkaConfigShape> => ({
  brokers: ["127.0.0.1:9092"],
  topic: `heartbeat-it-${randomUUID()}`,
  groupId: `heartbeat-group-${randomUUID()}`,
  clientId: `heartbeat-client-${randomUUID()}`,
  producerInterval: Duration.seconds(1),
  metricsInterval: Duration.seconds(30),
  consumerRetryBase: Duration.millis(100),
  consumerRetryMaxRetries: 5,
  strictEnv: false,
  telemetryExporter: "console",
  telemetryExportPath: "./telemetry/test-metrics.ndjson",
  rpcWsPort: overrides.rpcWsPort ?? (await findAvailablePort()),
  rpcWsPath: overrides.rpcWsPath ?? "/ws",
  ...overrides
});

export const waitFor = async <T>(
  description: string,
  f: () => Promise<T | undefined> | T | undefined,
  options: {
    readonly timeoutMs?: number;
    readonly intervalMs?: number;
  } = {}
): Promise<T> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await f();
    if (value !== undefined) {
      return value;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for ${description} after ${timeoutMs}ms`);
};

export const startHeartbeatServer = async (
  config: KafkaConfigShape
): Promise<StartedHeartbeatServer> => {
  const child = spawn(process.execPath, ["--import", "tsx", "consumer.ts"], {
    cwd: ROOT_DIR,
    env: makeChildEnvironment(config),
    stdio: ["ignore", "pipe", "pipe"]
  });
  const logs: Array<string> = [];
  const exitPromise = once(child, "exit").then(
    ([code, signal]) =>
      ({
        code,
        signal
      }) satisfies ChildExitResult
  );

  captureChildOutput(child, "stdout", logs);
  captureChildOutput(child, "stderr", logs);

  const baseUrl = `http://127.0.0.1:${config.rpcWsPort}`;
  const wsUrl = `ws://127.0.0.1:${config.rpcWsPort}${config.rpcWsPath}`;

  try {
    await waitFor("consumer server health endpoint", async () => {
      assertChildStillRunning(child, logs);

      try {
        const response = await fetch(`${baseUrl}/health`, {
          signal: AbortSignal.timeout(500)
        });
        if (!response.ok) {
          return undefined;
        }

        const body = (await response.json()) as HeartbeatServerStatus;
        return body.ready ? body : undefined;
      } catch {
        return undefined;
      }
    });
  } catch (error) {
    await stopChildProcess(child, exitPromise).catch(() => undefined);

    if (error instanceof Error) {
      throw new Error(`${error.message}\n${formatCapturedLogs(logs)}`);
    }

    throw error;
  }

  return {
    config,
    baseUrl,
    wsUrl,
    stop: () => stopChildProcess(child, exitPromise)
  };
};

export const readHealthJson = async (
  baseUrl: string,
  path = "/health"
): Promise<{ readonly statusCode: number; readonly body: HeartbeatServerStatus }> => {
  const response = await fetch(`${baseUrl}${path}`);
  const body = (await response.json()) as HeartbeatServerStatus;

  return {
    statusCode: response.status,
    body
  };
};

export const readHeartbeatSnapshot = async (
  wsUrl: string
): Promise<HeartbeatSnapshotEvent> =>
  Effect.runPromise(
    withTimeout(
      Effect.scoped(
        Effect.gen(function* () {
          const client = yield* RpcClient.make(HeartbeatRpcGroup).pipe(
            Effect.provide(nodeRpcClientLayer(wsUrl))
          );
          const queue = yield* client.SubscribeHeartbeats(null, {
            asQueue: true
          });
          const first = yield* Queue.take(queue);

          if (first.type !== "snapshot") {
            throw new Error(`expected an initial snapshot event, received ${first.type}`);
          }

          return first;
        })
      ),
      "heartbeat snapshot stream"
    )
  );

export const waitForReadyStatus = (baseUrl: string) =>
  waitFor("ready heartbeat status", async () => {
    const { body } = await readHealthJson(baseUrl);
    return body.ready ? body : undefined;
  });

export const produceHeartbeat = async (
  config: KafkaConfigShape,
  payload: Partial<TestHeartbeatPayload> = {}
): Promise<TestHeartbeatPayload> => {
  const heartbeat: TestHeartbeatPayload = {
    timestamp: payload.timestamp ?? Date.now(),
    system: payload.system ?? `system-${randomUUID().slice(0, 8)}`,
    region: payload.region ?? "Europe"
  };

  await Effect.runPromise(
    provideKafkaRuntime(
      Effect.gen(function* () {
        const admin = yield* KafkaAdminService;
        const producer = yield* KafkaProducerService;

        yield* admin.ensureTopic(config.topic);
        yield* producer.send(
          config.topic,
          Math.floor(Date.now()),
          JSON.stringify(heartbeat)
        );
      }),
      configLayer(config)
    )
  );

  return heartbeat;
};

export const collectSnapshotThenUpdate = async (
  wsUrl: string,
  afterSnapshot: () => Promise<void>
): Promise<readonly [HeartbeatEvent, HeartbeatEvent]> =>
  Effect.runPromise(
    withTimeout(
      Effect.scoped(
        Effect.gen(function* () {
          const client = yield* RpcClient.make(HeartbeatRpcGroup).pipe(
            Effect.provide(nodeRpcClientLayer(wsUrl))
          );
          const queue = yield* client.SubscribeHeartbeats(null, {
            asQueue: true
          });

          const first = yield* Queue.take(queue);
          yield* Effect.promise(() => afterSnapshot());
          const second = yield* Queue.take(queue);

          return [first, second] as const;
        })
      ),
      "heartbeat snapshot/update stream"
    )
  );

export const makeNodeHeartbeatStore = (wsUrl: string): HeartbeatStore =>
  makeHeartbeatStore(nodeRpcClientLayer(wsUrl));

export const hasStatusSubsequence = (
  observed: ReadonlyArray<string>,
  expected: ReadonlyArray<string>
) => {
  let matchIndex = 0;

  for (const status of observed) {
    if (status === expected[matchIndex]) {
      matchIndex += 1;
      if (matchIndex === expected.length) {
        return true;
      }
    }
  }

  return false;
};
