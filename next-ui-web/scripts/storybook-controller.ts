import { createHash, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { createServer as createNetServer } from "node:net";
import { Duration, Effect, Layer } from "effect";
import * as Fiber from "effect/Fiber";
import { KafkaConfig, type KafkaConfigShape } from "../../backend/src/config/kafka-config";
import { provideKafkaRuntime } from "../../backend/src/layers/kafka-runtime";
import { makeConsumerRuntime } from "../../backend/src/programs/consumer-program";
import { KafkaAdminService } from "../../backend/src/services/kafka-admin-service";
import { KafkaProducerService } from "../../backend/src/services/kafka-producer-service";
import {
  encodeHeartbeatKey,
  type HeartbeatIdentity
} from "../../shared/heartbeat-contract";
import {
  STORYBOOK_CONTROLLER_PORT,
  type StorybookScenarioDefinition,
  type StorybookScenarioStartRequest,
  type StorybookScenarioStartResponse,
  type StorybookScenarioStopRequest,
  type StorybookScenarioTouchRequest
} from "../lib/storybook-scenario";

const DEFAULT_BROKERS = process.env.KAFKA_BROKERS ?? "127.0.0.1:9092";
const CONTROLLER_IDLE_TTL_MS = 30_000;
const GC_INTERVAL_MS = 10_000;
const HEALTH_POLL_INTERVAL_MS = 300;

interface ActiveScenario {
  readonly scenarioId: string;
  readonly scenarioKey: string;
  readonly topic: string;
  readonly wsUrl: string;
  readonly httpBaseUrl: string;
  readonly config: KafkaConfigShape;
  readonly fiber: ReturnType<typeof Effect.runFork>;
  lastTouchedAt: number;
}

const scenariosById = new Map<string, ActiveScenario>();
const scenariosByKey = new Map<string, ActiveScenario>();

const hashScenarioKey = (input: string) =>
  createHash("sha1").update(input).digest("hex").slice(0, 12);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });

const text = (status: number, body: string) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });

const noContent = (status: 204 | 205 | 304) =>
  new Response(null, {
    status
  });

const readRequestBody = async (req: IncomingMessage) =>
  await new Promise<string>((resolve, reject) => {
    let body = "";

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const withCors = (response: Response) => {
  response.headers.set("access-control-allow-origin", "*");
  response.headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  response.headers.set("access-control-allow-headers", "content-type");
  return response;
};

const findAvailablePort = async (): Promise<number> =>
  await new Promise<number>((resolve, reject) => {
    const server = createNetServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (address === null || typeof address === "string") {
        server.close(() => reject(new Error("failed to allocate ephemeral port")));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });

const makeScenarioConfig = async (
  scenarioKey: string
): Promise<{ port: number; config: KafkaConfigShape; topic: string }> => {
  const port = await findAvailablePort();
  const topic = `storybook.${hashScenarioKey(scenarioKey)}.${randomUUID()}`;
  const runId = hashScenarioKey(`${topic}:${randomUUID()}`);

  return {
    port,
    topic,
    config: {
      brokers: DEFAULT_BROKERS.split(",").map((broker) => broker.trim()),
      topic,
      groupId: `storybook-${runId}-group`,
      clientId: `storybook-${runId}-client`,
      producerInterval: Duration.seconds(1),
      consumerRetryBase: Duration.millis(250),
      consumerRetryMaxRetries: 10,
      strictEnv: false,
      rpcWsPort: port,
      rpcWsPath: "/ws"
    }
  };
};

const makeConfigLayer = (config: KafkaConfigShape) =>
  Layer.succeed(KafkaConfig, config);

type HealthBody = Record<string, unknown>;

const waitForHealth = async (
  url: string,
  predicate: (body: HealthBody) => boolean,
  timeoutMs: number
) => {
  const deadline = Date.now() + timeoutMs;
  let lastStatus: number | null = null;
  let lastBody: unknown = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      lastStatus = response.status;
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const body = await response.json();
        lastBody = body;

        if (typeof body !== "object" || body === null) {
          await Effect.runPromise(Effect.sleep(Duration.millis(HEALTH_POLL_INTERVAL_MS)));
          continue;
        }

        if (predicate(body as HealthBody)) {
          return body;
        }
      }
    } catch {}

    await Effect.runPromise(Effect.sleep(Duration.millis(HEALTH_POLL_INTERVAL_MS)));
  }

  throw new Error(
    `timed out waiting for ${url} (lastStatus=${lastStatus ?? "none"}, lastBody=${JSON.stringify(lastBody)})`
  );
};

const expectedProcessCount = (scenario: StorybookScenarioDefinition) => {
  const present = new Set<string>();

  for (const step of scenario.steps) {
    const identity: HeartbeatIdentity = {
      region: step.region,
      system: step.system,
      appName: step.appName,
      hostname: step.hostname,
      processName: step.processName
    };
    const key = encodeHeartbeatKey(identity);

    if (step.kind === "tombstone") {
      present.delete(key);
      continue;
    }

    present.add(key);
  }

  return present.size;
};

const applyScenario = async (
  config: KafkaConfigShape,
  scenario: StorybookScenarioDefinition
) => {
  const program = provideKafkaRuntime(
    Effect.scoped(
      Effect.gen(function* () {
        const admin = yield* KafkaAdminService;
        const producer = yield* KafkaProducerService;

        yield* admin.ensureTopic(config.topic);

        let sequence = 1;

        for (const step of scenario.steps) {
          const identity: HeartbeatIdentity = {
            region: step.region,
            system: step.system,
            appName: step.appName,
            hostname: step.hostname,
            processName: step.processName
          };
          const key = encodeHeartbeatKey(identity);
          const payload =
            step.kind === "tombstone"
              ? null
              : JSON.stringify({
                  ...identity,
                  timestamp: Date.now() - (step.ageMs ?? 0)
                });

          yield* producer.send(config.topic, key, sequence, payload);
          sequence += 1;
        }
      })
    ),
    makeConfigLayer(config)
  );

  await Effect.runPromise(program);
};

const stopScenario = async (scenario: ActiveScenario) => {
  scenariosById.delete(scenario.scenarioId);
  scenariosByKey.delete(scenario.scenarioKey);
  await Effect.runPromise(Fiber.interrupt(scenario.fiber));
};

const startScenario = async (
  input: StorybookScenarioStartRequest
): Promise<StorybookScenarioStartResponse> => {
  const existing = scenariosByKey.get(input.scenarioKey);

  if (existing !== undefined) {
    existing.lastTouchedAt = Date.now();
    await applyScenario(existing.config, input.scenario);
    await waitForHealth(
      `${existing.httpBaseUrl}/health`,
      (body) =>
        body.ready === true &&
        body.processInstances === expectedProcessCount(input.scenario),
      20_000
    );

    return {
      scenarioId: existing.scenarioId,
      wsUrl: existing.wsUrl,
      httpBaseUrl: existing.httpBaseUrl,
      topic: existing.topic
    };
  }

  const { config, port, topic } = await makeScenarioConfig(input.scenarioKey);
  const fiber = Effect.runFork(makeConsumerRuntime(makeConfigLayer(config)));
  const wsUrl = `ws://127.0.0.1:${port}${config.rpcWsPath}`;
  const httpBaseUrl = `http://127.0.0.1:${port}`;
  const created: ActiveScenario = {
    scenarioId: randomUUID(),
    scenarioKey: input.scenarioKey,
    topic,
    wsUrl,
    httpBaseUrl,
    config,
    fiber,
    lastTouchedAt: Date.now()
  };

  scenariosById.set(created.scenarioId, created);
  scenariosByKey.set(created.scenarioKey, created);

  try {
    await waitForHealth(
      `${created.httpBaseUrl}/health`,
      (body) => body.ready === true,
      20_000
    );
    await applyScenario(created.config, input.scenario);
    await waitForHealth(
      `${created.httpBaseUrl}/health`,
      (body) =>
        body.ready === true &&
        body.processInstances === expectedProcessCount(input.scenario),
      20_000
    );
  } catch (error) {
    await stopScenario(created).catch(() => undefined);
    throw error;
  }

  return {
    scenarioId: created.scenarioId,
    wsUrl: created.wsUrl,
    httpBaseUrl: created.httpBaseUrl,
    topic: created.topic
  };
};

const touchScenario = (input: StorybookScenarioTouchRequest) => {
  const scenario = scenariosById.get(input.scenarioId);

  if (scenario === undefined) {
    return false;
  }

  scenario.lastTouchedAt = Date.now();
  return true;
};

const stopScenarioById = async (input: StorybookScenarioStopRequest) => {
  const scenario = scenariosById.get(input.scenarioId);

  if (scenario === undefined) {
    return false;
  }

  await stopScenario(scenario);
  return true;
};

const collectExpiredScenarios = () => {
  const now = Date.now();

  for (const scenario of scenariosById.values()) {
    if (now - scenario.lastTouchedAt <= CONTROLLER_IDLE_TTL_MS) {
      continue;
    }

    void stopScenario(scenario).catch((error) => {
      console.error("failed to stop expired storybook scenario", error);
    });
  }
};

const controller = createServer(async (req, res) => {
  const url = new URL(
    `http://127.0.0.1:${STORYBOOK_CONTROLLER_PORT}${req.url ?? "/"}`
  );

  let response: Response;

  try {
    if (req.method === "OPTIONS") {
      response = withCors(noContent(204));
    } else if (req.method === "GET" && url.pathname === "/health") {
      response = withCors(
        json(200, {
          ok: true,
          activeScenarios: scenariosById.size
        })
      );
    } else if (req.method === "POST" && url.pathname === "/api/scenarios/start") {
      const payload = JSON.parse(
        await readRequestBody(req)
      ) as StorybookScenarioStartRequest;
      response = withCors(json(200, await startScenario(payload)));
    } else if (req.method === "POST" && url.pathname === "/api/scenarios/touch") {
      const payload = JSON.parse(
        await readRequestBody(req)
      ) as StorybookScenarioTouchRequest;
      response = withCors(
        touchScenario(payload)
          ? json(200, { ok: true })
          : json(404, { ok: false, message: "scenario not found" })
      );
    } else if (req.method === "POST" && url.pathname === "/api/scenarios/stop") {
      const payload = JSON.parse(
        await readRequestBody(req)
      ) as StorybookScenarioStopRequest;
      response = withCors(
        (await stopScenarioById(payload))
          ? json(200, { ok: true })
          : json(404, { ok: false, message: "scenario not found" })
      );
    } else {
      response = withCors(text(404, "not found"));
    }
  } catch (error) {
    console.error("storybook controller request failed", error);
    response = withCors(
      json(500, {
        ok: false,
        message: error instanceof Error ? error.message : "unknown error"
      })
    );
  }

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = await response.text();
  res.end(body);
});

const gcTimer = setInterval(collectExpiredScenarios, GC_INTERVAL_MS);

const shutdown = async () => {
  clearInterval(gcTimer);
  controller.close();
  await Promise.all([...scenariosById.values()].map((scenario) => stopScenario(scenario)));
};

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});
process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

controller.listen(STORYBOOK_CONTROLLER_PORT, "127.0.0.1", () => {
  console.log(
    `storybook heartbeat controller ready on http://127.0.0.1:${STORYBOOK_CONTROLLER_PORT}`
  );
});
