import { Duration, Effect, Ref, Schedule } from "effect";
import { KafkaConfig, redactConfig } from "../config/kafka-config";
import { provideKafkaRuntime } from "../layers/kafka-runtime";
import { KafkaAdminService } from "../services/kafka-admin-service";
import { KafkaProducerService } from "../services/kafka-producer-service";
import { KafkaTelemetryService } from "../services/kafka-telemetry-service";
import { runMain } from "../runtime/run-main";

const REGIONS = ["USA", "Europe", "Asia"] as const;
const SYSTEMS = ["system-1", "system-2", "system-3", "system-4", "system-5"] as const;

const launchTelemetryReporter = (interval: Duration.Duration) =>
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

const ProducerProgram = Effect.gen(function* () {
  const config = yield* KafkaConfig;
  const admin = yield* KafkaAdminService;
  const producer = yield* KafkaProducerService;
  const indexRef = yield* Ref.make(0);

  yield* Effect.logInfo("effective kafka config", redactConfig(config));

  yield* admin.ensureTopic(config.topic);
  yield* launchTelemetryReporter(config.metricsInterval);

  yield* Effect.logInfo("producer ready", {
    brokers: config.brokers.join(","),
    topic: config.topic,
    interval: config.producerInterval
  });

  const sendOne = Effect.gen(function* () {
    const index = yield* Ref.updateAndGet(indexRef, (value) => value + 1);
    const slot = (index - 1) % (REGIONS.length * SYSTEMS.length);
    const region = REGIONS[Math.floor(slot / SYSTEMS.length)]!;
    const system = SYSTEMS[slot % SYSTEMS.length]!;
    const timestamp = Date.now();
    const payload = JSON.stringify({
      timestamp,
      system,
      region
    });

    yield* producer.send(config.topic, index, payload);

    yield* Effect.logDebug("producer sent message", {
      topic: config.topic,
      index,
      region,
      system,
      timestamp
    });
  });

  yield* sendOne.pipe(Effect.repeat(Schedule.spaced(config.producerInterval)));
});

export const ProducerRuntime = provideKafkaRuntime(Effect.scoped(ProducerProgram));

export const runProducerMain = () => runMain(ProducerRuntime);
