import assert from "node:assert/strict";
import { Effect } from "effect";
import { KafkaConfig } from "../src/config/kafka-config";
import { provideKafkaRuntime } from "../src/layers/kafka-runtime";
import { KafkaAdminService } from "../src/services/kafka-admin-service";
import { KafkaConsumerService } from "../src/services/kafka-consumer-service";
import { KafkaProducerService } from "../src/services/kafka-producer-service";
import { KafkaTelemetryService } from "../src/services/kafka-telemetry-service";
import { runMain } from "../src/runtime/run-main";

const MESSAGE_COUNT = Number(process.env.HARNESS_MESSAGE_COUNT ?? "30");

const waitForConsumed = (expected: number) =>
  Effect.gen(function* () {
    const telemetry = yield* KafkaTelemetryService;

    for (let i = 0; i < 300; i++) {
      const snapshot = yield* telemetry.snapshot;
      if (snapshot.consumed >= expected) {
        return snapshot;
      }
      yield* Effect.sleep("100 millis");
    }

    return yield* Effect.fail(
      new Error(`Timed out waiting for ${expected} consumed messages within 30s`)
    );
  });

const IntegrationHarness = Effect.gen(function* () {
  const config = yield* KafkaConfig;
  const admin = yield* KafkaAdminService;
  const producer = yield* KafkaProducerService;
  const consumer = yield* KafkaConsumerService;
  const telemetry = yield* KafkaTelemetryService;

  const topic = `${config.topic}-it-${Date.now()}`;

  yield* Effect.logInfo("integration harness starting", {
    topic,
    messageCount: MESSAGE_COUNT,
    brokers: config.brokers.join(",")
  });

  yield* admin.ensureTopic(topic);

  const consumerFiber = yield* consumer.consumeTopic(topic).pipe(Effect.forkScoped);

  yield* Effect.sleep("250 millis");

  for (let seq = 1; seq <= MESSAGE_COUNT; seq++) {
    yield* producer.send(topic, seq, JSON.stringify({ id: seq, source: "integration-harness" }));
  }

  const snapshot = yield* waitForConsumed(MESSAGE_COUNT);

  yield* Effect.sync(() => {
    consumerFiber.interruptUnsafe();
  });

  yield* telemetry.logSnapshot;

  yield* Effect.sync(() => {
    assert.ok(snapshot.produced >= MESSAGE_COUNT, `Produced ${snapshot.produced}, expected >= ${MESSAGE_COUNT}`);
    assert.ok(snapshot.consumed >= MESSAGE_COUNT, `Consumed ${snapshot.consumed}, expected >= ${MESSAGE_COUNT}`);
  });

  yield* Effect.logInfo("integration harness passed", {
    topic,
    produced: snapshot.produced,
    consumed: snapshot.consumed
  });
});

runMain(provideKafkaRuntime(Effect.scoped(IntegrationHarness)));
