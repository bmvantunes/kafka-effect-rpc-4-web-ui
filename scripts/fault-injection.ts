import { Duration, Effect, Layer } from "effect";
import { KafkaConfig } from "../src/config/kafka-config";
import { KafkaAdminService } from "../src/services/kafka-admin-service";
import { KafkaClientFactory } from "../src/services/kafka-client-factory-service";
import { KafkaProducerService } from "../src/services/kafka-producer-service";
import { KafkaTelemetryExporter } from "../src/services/kafka-telemetry-exporter-service";
import { KafkaTelemetryService } from "../src/services/kafka-telemetry-service";
import { runMain } from "../src/runtime/run-main";

const badConfigLayer = Layer.succeed(KafkaConfig)({
  brokers: ["127.0.0.1:1"],
  topic: "fault-topic",
  groupId: "fault-group",
  clientId: "fault-client",
  producerInterval: Duration.seconds(1),
  metricsInterval: Duration.seconds(5),
  consumerRetryBase: Duration.millis(100),
  consumerRetryMaxRetries: 1,
  strictEnv: false,
  telemetryExporter: "console",
  telemetryExportPath: "./telemetry/fault-injection.ndjson",
  rpcWsPort: 3001,
  rpcWsPath: "/ws"
});

const provideFaultRuntime = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.provide(KafkaProducerService.Live),
    Effect.provide(KafkaAdminService.Live),
    Effect.provide(KafkaTelemetryService.Live),
    Effect.provide(KafkaTelemetryExporter.Live),
    Effect.provide(KafkaClientFactory.Live),
    Effect.provide(badConfigLayer)
  );

const expectFailureTag = <E extends { _tag: string }>(
  name: string,
  effect: Effect.Effect<unknown, E>,
  expectedTag: string
) =>
  effect.pipe(
    Effect.matchEffect({
      onSuccess: () =>
        Effect.fail(new Error(`${name}: expected failure '${expectedTag}' but succeeded`)),
      onFailure: (error) =>
        error._tag === expectedTag
          ? Effect.logInfo("fault scenario passed", { name, expectedTag })
          : Effect.fail(
              new Error(`${name}: expected '${expectedTag}', got '${error._tag}'`)
            )
    })
  );

const configValidationScenario = Effect.gen(function* () {
  const original = process.env.KAFKA_BROKERS;
  process.env.KAFKA_BROKERS = " , , ";

  try {
    yield* expectFailureTag(
      "invalid-brokers-config",
      Effect.gen(function* () {
        yield* KafkaConfig;
      }).pipe(Effect.provide(KafkaConfig.Live)),
      "KafkaConfigError"
    );
  } finally {
    if (original === undefined) {
      delete process.env.KAFKA_BROKERS;
    } else {
      process.env.KAFKA_BROKERS = original;
    }
  }
});

const adminFaultScenario = expectFailureTag(
  "admin-with-unreachable-broker",
  Effect.scoped(
    Effect.gen(function* () {
      const admin = yield* KafkaAdminService;
      yield* admin.ensureTopic("fault-topic");
    })
  ).pipe(provideFaultRuntime),
  "KafkaAdminError"
);

const producerFaultScenario = expectFailureTag(
  "producer-with-unreachable-broker",
  Effect.scoped(
    Effect.gen(function* () {
      const producer = yield* KafkaProducerService;
      yield* producer.send("fault-topic", 1, JSON.stringify({ test: true }));
    })
  ).pipe(provideFaultRuntime),
  "KafkaProducerError"
);

const program = Effect.gen(function* () {
  yield* Effect.logInfo("fault injection harness starting");
  yield* configValidationScenario;
  yield* adminFaultScenario;
  yield* producerFaultScenario;
  yield* Effect.logInfo("fault injection harness passed");
});

runMain(program);
