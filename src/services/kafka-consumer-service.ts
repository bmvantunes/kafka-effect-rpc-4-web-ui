import { Effect, Layer, Option, Scope, ServiceMap, Stream } from "effect";
import { KafkaConsumerError, inferInfraReason } from "../errors/kafka-errors";
import { KafkaClientFactory } from "./kafka-client-factory-service";
import type { KafkaMessageEnvelope, KafkaMessagesStream } from "./kafka-client-types";
import { KafkaTelemetryService, type KafkaTelemetryServiceShape } from "./kafka-telemetry-service";

export interface KafkaConsumerServiceShape {
  readonly consumeTopic: (topic: string) => Effect.Effect<void, KafkaConsumerError, Scope.Scope>;
}

const renderMessage = (message: KafkaMessageEnvelope): Record<string, unknown> => ({
  topic: message.topic,
  partition: message.partition,
  offset: message.offset.toString(),
  key: message.key,
  value: message.value
});

const closeStreamWithLogs = (stream: KafkaMessagesStream, topic: string) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("kafka message stream shutdown starting", { topic });

    const result = yield* (Effect.tryPromise({
        try: () => stream.close(),
        catch: (cause) => cause
      }) as Effect.Effect<void, unknown>).pipe(
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

const runMessageStream = (
  stream: KafkaMessagesStream,
  topic: string,
  telemetry: KafkaTelemetryServiceShape
): Effect.Effect<never, KafkaConsumerError> =>
  Stream.fromAsyncIterable(
    stream,
    (cause) =>
      new KafkaConsumerError({
        category: "infra",
        reason: inferInfraReason(cause),
        operation: "consume-stream",
        topic,
        retryable: true,
        cause
      })
  ).pipe(
    Stream.tap((message) =>
      telemetry.recordConsumed.pipe(
        Effect.flatMap(() => Effect.logInfo("kafka message consumed", renderMessage(message)))
      )
    ),
    Stream.runDrain,
    Effect.withSpan("kafka.consumer.streamLoop", {
      attributes: { topic }
    }),
    Effect.flatMap(() =>
      Effect.fail(
        new KafkaConsumerError({
          category: "domain",
          reason: "StreamEnded",
          operation: "consume-end",
          topic,
          retryable: true
        })
      )
    )
  );

export class KafkaConsumerService extends ServiceMap.Service<KafkaConsumerService, KafkaConsumerServiceShape>()(
  "kafka/KafkaConsumerService"
) {
  static readonly Live = Layer.effect(
    KafkaConsumerService,
    Effect.gen(function* () {
      const clients = yield* KafkaClientFactory;
      const telemetry = yield* KafkaTelemetryService;
      const consumer = yield* clients.consumer;

      const consumeTopic: KafkaConsumerServiceShape["consumeTopic"] = (topic) =>
        Effect.gen(function* () {
          const stream = yield* Effect.acquireRelease(
            Effect.tryPromise({
              try: () =>
                consumer.consume({
                  topics: [topic],
                  autocommit: true,
                  fallbackMode: "earliest"
                }),
              catch: (cause) =>
                new KafkaConsumerError({
                  category: "infra",
                  reason: inferInfraReason(cause),
                  operation: "consume-start",
                  topic,
                  retryable: true,
                  cause
                })
            }),
            (messages) => closeStreamWithLogs(messages, topic)
          );

          yield* runMessageStream(stream, topic, telemetry);
        }).pipe(
          Effect.withSpan("kafka.consumer.consumeTopic", { attributes: { topic } }),
          Effect.tapError(() =>
            telemetry.recordConsumerError.pipe(
              Effect.flatMap(() => telemetry.recordErrorType("KafkaConsumerError"))
            )
          )
        );

      return {
        consumeTopic
      } satisfies KafkaConsumerServiceShape;
    })
  );
}
