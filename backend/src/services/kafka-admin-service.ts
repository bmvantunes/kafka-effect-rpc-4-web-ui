import { Effect, Layer, ServiceMap } from "effect";
import { KafkaAdminError, inferInfraReason } from "../errors/kafka-errors";
import { KafkaConfig } from "../config/kafka-config";
import { KafkaClientFactory } from "./kafka-client-factory-service";

export interface KafkaAdminServiceShape {
  readonly ensureTopic: (topic?: string) => Effect.Effect<void, KafkaAdminError>;
}

export class KafkaAdminService extends ServiceMap.Service<KafkaAdminService, KafkaAdminServiceShape>()(
  "kafka/KafkaAdminService"
) {
  static readonly Live = Layer.effect(
    KafkaAdminService,
    Effect.gen(function* () {
      const config = yield* KafkaConfig;
      const clients = yield* KafkaClientFactory;
      const admin = yield* clients.admin;

      const listTopics = Effect.tryPromise({
        try: () => admin.listTopics(),
        catch: (cause) =>
          new KafkaAdminError({
            category: "infra",
            reason: inferInfraReason(cause),
            operation: "list-topics",
            retryable: true,
            cause
          })
      });

      const ensureTopic = (topic = config.topic) =>
        Effect.gen(function* () {
          const topics = yield* listTopics;
          if (topics.includes(topic)) {
            return;
          }

          const create = Effect.tryPromise({
            try: () =>
              admin.createTopics({
                topics: [topic],
                partitions: 1,
                replicas: 1
              }),
            catch: (cause) =>
              new KafkaAdminError({
                category: "infra",
                reason: inferInfraReason(cause),
                operation: "create-topic",
                topic,
                retryable: true,
                cause
              })
          });

          yield* create.pipe(
            Effect.catch((error) =>
              listTopics.pipe(
                Effect.flatMap((after) =>
                  after.includes(topic)
                    ? Effect.logInfo("topic already created concurrently", { topic })
                    : Effect.fail(error)
                )
              )
            )
          );

          yield* Effect.logInfo("topic ensured", { topic });
        }).pipe(
          Effect.withSpan("kafka.admin.ensureTopic", { attributes: { topic } }),
          Effect.mapError(
            (cause) =>
              new KafkaAdminError({
                category: cause.category,
                reason: cause.reason,
                operation: "ensure-topic",
                topic,
                retryable: cause.retryable,
                cause
              })
          )
        );

      return {
        ensureTopic
      } satisfies KafkaAdminServiceShape;
    })
  );
}
