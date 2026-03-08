import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { Effect, HashMap, Option, PubSub, Ref, Schedule, Stream } from "effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { KafkaConfig, type KafkaConfigShape, redactConfig } from "../config/kafka-config";
import { consumerRetryPolicy } from "../config/kafka-policy";
import type { HeartbeatPayload } from "../domain/heartbeat";
import { KafkaConsumerError, inferInfraReason } from "../errors/kafka-errors";
import { provideKafkaRuntime } from "../layers/kafka-runtime";
import {
  HeartbeatRpcGroup,
  type HeartbeatServerStatus,
  type HeartbeatSnapshotEvent,
  type HeartbeatUpdateEvent
} from "../rpc/heartbeat-rpc";
import { runMain } from "../runtime/run-main";
import { KafkaAdminService } from "../services/kafka-admin-service";
import { KafkaClientFactory } from "../services/kafka-client-factory-service";
import { KafkaTelemetryService } from "../services/kafka-telemetry-service";
import type { KafkaMessagesStream } from "../services/kafka-client-types";

type HeartbeatState = HashMap.HashMap<string, HashMap.HashMap<string, number>>;

type ConsumerState = "starting" | "running" | "reconnecting";

interface RuntimeStatus {
  readonly consumerState: ConsumerState;
  readonly connectedClients: number;
  readonly lastHeartbeatAt: number | null;
}

const decodeHeartbeat = (input: unknown): HeartbeatPayload => {
  if (typeof input !== "object" || input === null) {
    throw new Error("heartbeat payload must be an object");
  }

  const candidate = input as Record<string, unknown>;
  const { timestamp, system, region } = candidate;

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new Error("heartbeat.timestamp must be a finite number");
  }
  if (typeof system !== "string" || system.length === 0) {
    throw new Error("heartbeat.system must be a non-empty string");
  }
  if (typeof region !== "string" || region.length === 0) {
    throw new Error("heartbeat.region must be a non-empty string");
  }

  return {
    timestamp,
    system,
    region
  };
};

const updateState = (
  state: HeartbeatState,
  region: string,
  system: string,
  timestamp: number
): HeartbeatState => {
  const systems = HashMap.get(state, region).pipe(
    Option.getOrElse(() => HashMap.empty<string, number>())
  );
  const nextSystems = HashMap.set(systems, system, timestamp);
  return HashMap.set(state, region, nextSystems);
};

const regionMinTimestamp = (systems: HashMap.HashMap<string, number>): number =>
  Array.from(HashMap.values(systems)).reduce(
    (min, timestamp) => Math.min(min, timestamp),
    Number.POSITIVE_INFINITY
  );

const makeSnapshot = (state: HeartbeatState): HeartbeatSnapshotEvent => ({
  type: "snapshot",
  emittedAt: Date.now(),
  regions: Array.from(HashMap.entries(state)).map(([region, systems]) => ({
    region,
    minTimestamp: regionMinTimestamp(systems),
    systems: Array.from(HashMap.entries(systems))
      .map(([system, timestamp]) => ({ system, timestamp }))
      .sort((a, b) => a.system.localeCompare(b.system))
  }))
});

const systemCount = (state: HeartbeatState): number =>
  Array.from(HashMap.values(state)).reduce(
    (count, systems) => count + Array.from(HashMap.values(systems)).length,
    0
  );

const makeServerStatus = (
  config: KafkaConfigShape,
  state: HeartbeatState,
  runtimeStatus: RuntimeStatus
): HeartbeatServerStatus => ({
  status: runtimeStatus.consumerState === "running" ? "ok" : "degraded",
  ready: runtimeStatus.consumerState === "running",
  consumerState: runtimeStatus.consumerState,
  topic: config.topic,
  wsPort: config.rpcWsPort,
  wsPath: config.rpcWsPath,
  connectedClients: runtimeStatus.connectedClients,
  regions: Array.from(HashMap.keys(state)).length,
  systems: systemCount(state),
  lastHeartbeatAt: runtimeStatus.lastHeartbeatAt
});

const getServerStatus = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<HeartbeatState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>
) =>
  Effect.all({
    state: Ref.get(stateRef),
    runtimeStatus: Ref.get(runtimeStatusRef)
  }).pipe(
    Effect.map(({ state, runtimeStatus }) =>
      makeServerStatus(config, state, runtimeStatus)
    )
  );

const healthResponse = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<HeartbeatState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>,
  readinessOnly: boolean
) =>
  Effect.gen(function* () {
    const status = yield* getServerStatus(config, stateRef, runtimeStatusRef);
    return yield* HttpServerResponse.json(status, {
      status: readinessOnly && !status.ready ? 503 : 200
    });
  });

const closeStreamWithLogs = (
  stream: KafkaMessagesStream,
  topic: string
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("kafka message stream shutdown starting", { topic });

    const result = yield* Effect.tryPromise({
      try: () => stream.close(),
      catch: (cause) => cause
    }).pipe(
      Effect.timeoutOption("5 seconds"),
      Effect.catchIf(
        (_error): _error is unknown => true,
        (error) =>
          Effect.logWarning("kafka message stream shutdown failed", {
            topic,
            error
          }).pipe(Effect.as(Option.none<void>()))
      )
    );

    if (Option.isSome(result)) {
      yield* Effect.logInfo("kafka message stream shutdown completed", { topic });
      return;
    }

    yield* Effect.logWarning("kafka message stream shutdown timed out", { topic });
  }).pipe(Effect.orElseSucceed(() => undefined));

const rpcServerLayer = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<HeartbeatState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>,
  updates: PubSub.PubSub<HeartbeatUpdateEvent>
) => {
  const handlers = HeartbeatRpcGroup.toLayer(
    HeartbeatRpcGroup.of({
      SubscribeHeartbeats: () =>
        Stream.unwrap(
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const runtimeStatus = yield* Ref.updateAndGet(
              runtimeStatusRef,
              (current) => ({
                ...current,
                connectedClients: current.connectedClients + 1
              })
            );

            yield* Effect.logInfo("heartbeat RPC client subscribed", {
              topic: config.topic,
              connectedClients: runtimeStatus.connectedClients
            });

            return Stream.make(makeSnapshot(state)).pipe(
              Stream.concat(Stream.fromPubSub(updates)),
              Stream.ensuring(
                Ref.updateAndGet(runtimeStatusRef, (current) => ({
                  ...current,
                  connectedClients: Math.max(0, current.connectedClients - 1)
                })).pipe(
                  Effect.flatMap((nextRuntimeStatus) =>
                    Effect.logInfo("heartbeat RPC client disconnected", {
                      topic: config.topic,
                      connectedClients: nextRuntimeStatus.connectedClients
                    })
                  )
                )
              )
            );
          })
        )
    })
  );

  const httpRoutes = Layer.mergeAll(
    HttpRouter.add(
      "GET",
      "/health",
      healthResponse(config, stateRef, runtimeStatusRef, false)
    ),
    HttpRouter.add(
      "GET",
      "/ready",
      healthResponse(config, stateRef, runtimeStatusRef, true)
    )
  );

  const appLayer = Layer.mergeAll(
    httpRoutes,
    RpcServer.layerHttp({
      group: HeartbeatRpcGroup,
      path: config.rpcWsPath as HttpRouter.PathInput,
      protocol: "websocket"
    }).pipe(
      Layer.provide(handlers),
      Layer.provide(RpcSerialization.layerJson)
    )
  );

  return HttpRouter.serve(appLayer, {
    disableListenLog: true
  }).pipe(
    Layer.provide(
      NodeHttpServer.layer(createHttpServer, {
        port: config.rpcWsPort
      })
    )
  );
};

const ensurePortAvailable = (port: number) =>
  Effect.tryPromise({
    try: () =>
      new Promise<void>((resolve, reject) => {
        const server = createNetServer();
        server.once("error", reject);
        server.once("listening", () => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
        server.listen(port, "0.0.0.0");
      }),
    catch: (cause) => cause
  }).pipe(
    Effect.tapError((error) =>
      Effect.logError("consumer http/rpc port unavailable", {
        port,
        error
      })
    ),
    Effect.asVoid
  );

const consumeHeartbeats = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<HeartbeatState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>,
  updates: PubSub.PubSub<HeartbeatUpdateEvent>
) =>
  Effect.gen(function* () {
    const clients = yield* KafkaClientFactory;
    const telemetry = yield* KafkaTelemetryService;
    const retryPolicy = yield* consumerRetryPolicy;
    const consumer = yield* clients.consumer;

    const runOnce = Effect.gen(function* () {
      const stream = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () =>
            consumer.consume({
              topics: [config.topic],
              autocommit: true,
              fallbackMode: "earliest"
            }),
          catch: (cause) =>
            new KafkaConsumerError({
              category: "infra",
              reason: inferInfraReason(cause),
              operation: "consume-start",
              topic: config.topic,
              retryable: true,
              cause
            })
        }),
        (messages) => closeStreamWithLogs(messages, config.topic)
      );

      yield* Ref.update(runtimeStatusRef, (current): RuntimeStatus => ({
        ...current,
        consumerState: "running"
      }));

      yield* Stream.fromAsyncIterable(
        stream,
        (cause) =>
          new KafkaConsumerError({
            category: "infra",
            reason: inferInfraReason(cause),
            operation: "consume-stream",
            topic: config.topic,
            retryable: true,
            cause
          })
      ).pipe(
        Stream.runForEach((message) =>
          Effect.gen(function* () {
            const parsed = yield* Effect.try({
              try: () => JSON.parse(message.value),
              catch: (cause) =>
                new KafkaConsumerError({
                  category: "domain",
                  reason: "InvalidMessage",
                  operation: "consume-stream",
                  topic: config.topic,
                  retryable: false,
                  cause
                })
            });

            const heartbeat = yield* Effect.try({
              try: () => decodeHeartbeat(parsed),
              catch: (cause) =>
                new KafkaConsumerError({
                  category: "domain",
                  reason: "InvalidMessage",
                  operation: "consume-stream",
                  topic: config.topic,
                  retryable: false,
                  cause
                })
            });

            yield* Ref.update(stateRef, (state) =>
              updateState(state, heartbeat.region, heartbeat.system, heartbeat.timestamp)
            );

            const regionMin = yield* Ref.get(stateRef).pipe(
              Effect.map((state) =>
                HashMap.get(state, heartbeat.region).pipe(
                  Option.match({
                    onNone: () => heartbeat.timestamp,
                    onSome: regionMinTimestamp
                  })
                )
              )
            );

            yield* Ref.update(runtimeStatusRef, (current) => ({
              ...current,
              lastHeartbeatAt: heartbeat.timestamp
            }));

            const update: HeartbeatUpdateEvent = {
              type: "update",
              emittedAt: Date.now(),
              region: heartbeat.region,
              system: heartbeat.system,
              timestamp: heartbeat.timestamp,
              regionMinTimestamp: regionMin
            };

            yield* telemetry.recordConsumed;
            yield* PubSub.publish(updates, update);
          })
        )
      );
    });

    yield* runOnce.pipe(
      Effect.tapError(() =>
        Ref.update(runtimeStatusRef, (current): RuntimeStatus => ({
          ...current,
          consumerState: "reconnecting"
        }))
      ),
      Effect.tapError(() =>
        telemetry.recordConsumerError.pipe(
          Effect.flatMap(() => telemetry.recordErrorType("HeartbeatConsumer"))
        )
      ),
      Effect.retry(retryPolicy)
    );
  });

const launchTelemetryReporter = (interval: KafkaConfigShape["metricsInterval"]) =>
  Effect.gen(function* () {
    const telemetry = yield* KafkaTelemetryService;

    yield* Effect.logInfo("telemetry reporter starting", { interval });

    yield* telemetry.logSnapshot.pipe(
      Effect.repeat(Schedule.spaced(interval)),
      Effect.ensuring(Effect.logInfo("telemetry reporter stopping")),
      Effect.withSpan("kafka.telemetry.reporter"),
      Effect.forkScoped,
      Effect.asVoid
    );
  });

export const ConsumerProgram = Effect.gen(function* () {
  const config = yield* KafkaConfig;
  const admin = yield* KafkaAdminService;
  const stateRef = yield* Ref.make(HashMap.empty<string, HashMap.HashMap<string, number>>());
  const runtimeStatusRef = yield* Ref.make<RuntimeStatus>({
    consumerState: "starting",
    connectedClients: 0,
    lastHeartbeatAt: null
  });
  const updates = yield* PubSub.unbounded<HeartbeatUpdateEvent>();

  yield* Effect.logInfo("effective kafka config", redactConfig(config));
  yield* admin.ensureTopic(config.topic);
  yield* launchTelemetryReporter(config.metricsInterval);
  yield* ensurePortAvailable(config.rpcWsPort);

  yield* Effect.logInfo("heartbeat HTTP/RPC server ready", {
    topic: config.topic,
    brokers: config.brokers.join(","),
    httpPort: config.rpcWsPort,
    wsPath: config.rpcWsPath,
    healthPath: "/health",
    readyPath: "/ready"
  });

  yield* Effect.all(
    [
      Layer.launch(rpcServerLayer(config, stateRef, runtimeStatusRef, updates)),
      consumeHeartbeats(config, stateRef, runtimeStatusRef, updates)
    ],
    { concurrency: "unbounded" }
  );
});

export const makeConsumerRuntime = <ConfigE, ConfigR>(
  configLayer?: Layer.Layer<KafkaConfig, ConfigE, ConfigR>
) =>
  provideKafkaRuntime(
    Effect.scoped(ConsumerProgram),
    (configLayer ?? KafkaConfig.Live) as Layer.Layer<KafkaConfig, ConfigE, ConfigR>
  );

export const ConsumerRuntime = provideKafkaRuntime(Effect.scoped(ConsumerProgram));

export const runConsumerMain = () => runMain(ConsumerRuntime);
