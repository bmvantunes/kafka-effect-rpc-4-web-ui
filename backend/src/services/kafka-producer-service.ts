import { Effect, Layer, ServiceMap } from "effect";
import { KafkaProducerError, inferInfraReason } from "../errors/kafka-errors";
import { KafkaClientFactory } from "./kafka-client-factory-service";

export interface KafkaProducerServiceShape {
  readonly send: (
    topic: string,
    key: string,
    sequence: number,
    payload: string | null
  ) => Effect.Effect<void, KafkaProducerError>;
}

export class KafkaProducerService extends ServiceMap.Service<KafkaProducerService, KafkaProducerServiceShape>()(
  "kafka/KafkaProducerService"
) {
  static readonly Live = Layer.effect(
    KafkaProducerService,
    Effect.gen(function* () {
      const clients = yield* KafkaClientFactory;
      const producer = yield* clients.producer;

      const send: KafkaProducerServiceShape["send"] = (topic, key, sequence, payload) =>
        Effect.tryPromise({
          try: () =>
            producer.send({
              acks: 1,
              messages: [
                {
                  topic,
                  key,
                  value: payload
                }
              ]
            }),
          catch: (cause) =>
            new KafkaProducerError({
              category: "infra",
              reason: inferInfraReason(cause),
              operation: "send",
              topic,
              sequence,
              retryable: true,
              cause
            })
        }).pipe(
          Effect.asVoid,
          Effect.withSpan("kafka.producer.send", {
            attributes: {
              topic,
              key,
              sequence
            }
          })
        );

      return {
        send
      } satisfies KafkaProducerServiceShape;
    })
  );
}
