import { Effect, Layer, Metric, ServiceMap } from "effect";
import { KafkaTelemetryExporter } from "./kafka-telemetry-exporter-service";

const producedCounter = Metric.counter("kafka_messages_produced_total", {
  incremental: true,
  description: "Total produced Kafka messages"
});

const consumedCounter = Metric.counter("kafka_messages_consumed_total", {
  incremental: true,
  description: "Total consumed Kafka messages"
});

const producerErrorCounter = Metric.counter("kafka_producer_errors_total", {
  incremental: true,
  description: "Total producer errors"
});

const consumerErrorCounter = Metric.counter("kafka_consumer_errors_total", {
  incremental: true,
  description: "Total consumer errors"
});

const adminErrorCounter = Metric.counter("kafka_admin_errors_total", {
  incremental: true,
  description: "Total admin errors"
});

const errorFrequency = Metric.frequency("kafka_error_type_total", {
  description: "Count of errors by logical type"
});

export interface KafkaTelemetrySnapshot {
  readonly produced: number;
  readonly consumed: number;
  readonly producerErrors: number;
  readonly consumerErrors: number;
  readonly adminErrors: number;
}

export interface KafkaTelemetryServiceShape {
  readonly recordProduced: Effect.Effect<void>;
  readonly recordConsumed: Effect.Effect<void>;
  readonly recordProducerError: Effect.Effect<void>;
  readonly recordConsumerError: Effect.Effect<void>;
  readonly recordAdminError: Effect.Effect<void>;
  readonly recordErrorType: (tag: string) => Effect.Effect<void>;
  readonly snapshot: Effect.Effect<KafkaTelemetrySnapshot>;
  readonly logSnapshot: Effect.Effect<void>;
}

const extractCounter = (state: Metric.CounterState<number>): number => state.count;

export class KafkaTelemetryService extends ServiceMap.Service<KafkaTelemetryService, KafkaTelemetryServiceShape>()(
  "kafka/KafkaTelemetryService"
) {
  static readonly Live = Layer.effect(
    KafkaTelemetryService,
    Effect.gen(function* () {
      const exporter = yield* KafkaTelemetryExporter;

      const recordProduced = Metric.update(producedCounter, 1);
      const recordConsumed = Metric.update(consumedCounter, 1);
      const recordProducerError = Metric.update(producerErrorCounter, 1);
      const recordConsumerError = Metric.update(consumerErrorCounter, 1);
      const recordAdminError = Metric.update(adminErrorCounter, 1);

      const recordErrorType = (tag: string) => Metric.update(errorFrequency, tag);

      const snapshot = Effect.gen(function* () {
        const produced = yield* Metric.value(producedCounter).pipe(Effect.map(extractCounter));
        const consumed = yield* Metric.value(consumedCounter).pipe(Effect.map(extractCounter));
        const producerErrors = yield* Metric.value(producerErrorCounter).pipe(Effect.map(extractCounter));
        const consumerErrors = yield* Metric.value(consumerErrorCounter).pipe(Effect.map(extractCounter));
        const adminErrors = yield* Metric.value(adminErrorCounter).pipe(Effect.map(extractCounter));

        return {
          produced,
          consumed,
          producerErrors,
          consumerErrors,
          adminErrors
        } satisfies KafkaTelemetrySnapshot;
      });

      const logSnapshot = snapshot.pipe(
        Effect.tap((data) => exporter.exportSnapshot(data)),
        Effect.flatMap((data) => Effect.logInfo("kafka telemetry snapshot", data))
      );

      return {
        recordProduced,
        recordConsumed,
        recordProducerError,
        recordConsumerError,
        recordAdminError,
        recordErrorType,
        snapshot,
        logSnapshot
      } satisfies KafkaTelemetryServiceShape;
    })
  );
}
