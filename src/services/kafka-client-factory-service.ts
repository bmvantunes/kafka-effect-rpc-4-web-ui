import { Admin, Consumer, Producer, stringDeserializer, stringSerializer } from "@platformatic/kafka";
import { Effect, Layer, Option, Scope, ServiceMap } from "effect";
import { KafkaConfig } from "../config/kafka-config";
import { KafkaClientError, inferInfraReason } from "../errors/kafka-errors";
import type {
  KafkaAdminClient,
  KafkaConsumerClient,
  KafkaMessageEnvelope,
  KafkaMessagesStream,
  KafkaProducerClient
} from "./kafka-client-types";

export interface KafkaClientFactoryShape {
  readonly admin: Effect.Effect<KafkaAdminClient, KafkaClientError, Scope.Scope>;
  readonly producer: Effect.Effect<KafkaProducerClient, KafkaClientError, Scope.Scope>;
  readonly consumer: Effect.Effect<KafkaConsumerClient, KafkaClientError, Scope.Scope>;
}

const closeWithLogs = <A extends { close: () => Promise<void> }>(
  label: string,
  client: A,
  toError: (cause: unknown) => KafkaClientError
) : Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`${label} shutdown starting`);

    const result = yield* (Effect.tryPromise({
        try: () => client.close(),
        catch: toError
      }) as Effect.Effect<void, KafkaClientError>).pipe(
      Effect.timeoutOption("5 seconds"),
      Effect.catchIf(
        (_error): _error is KafkaClientError => true,
        (error) =>
          Effect.logWarning(`${label} shutdown failed`, {
            error
          }).pipe(Effect.as(Option.none<void>()))
      )
    );

    if (Option.isSome(result)) {
      yield* Effect.logInfo(`${label} shutdown completed`);
      return;
    }

    yield* Effect.logWarning(`${label} shutdown timed out`);
  }).pipe(Effect.orElseSucceed(() => undefined));

const mapMessage = (message: {
  topic: string;
  partition: number;
  offset: bigint;
  key: unknown;
  value: unknown;
}): KafkaMessageEnvelope => ({
  topic: message.topic,
  partition: message.partition,
  offset: message.offset,
  key: String(message.key),
  value: String(message.value)
});

class PlatformaticMessagesStream implements KafkaMessagesStream {
  constructor(
    private readonly stream: AsyncIterable<{
      topic: string;
      partition: number;
      offset: bigint;
      key: unknown;
      value: unknown;
    }> & { close: () => Promise<void> }
  ) {}

  close(): Promise<void> {
    return this.stream.close();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<KafkaMessageEnvelope> {
    for await (const message of this.stream) {
      yield mapMessage(message);
    }
  }
}

export class KafkaClientFactory extends ServiceMap.Service<KafkaClientFactory, KafkaClientFactoryShape>()(
  "kafka/KafkaClientFactory"
) {
  static readonly Live = Layer.effect(
    KafkaClientFactory,
    Effect.gen(function* () {
      const config = yield* KafkaConfig;

      const admin = Effect.acquireRelease(
        Effect.sync(
          () =>
            new Admin({
              clientId: `${config.clientId}-admin`,
              bootstrapBrokers: [...config.brokers]
            })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new KafkaClientError({
                category: "infra",
                reason: inferInfraReason(cause),
                client: "admin",
                operation: "create",
                retryable: false,
                cause
              })
          ),
          Effect.tap(() => Effect.logInfo("kafka admin client started"))
        ),
        (client) =>
          closeWithLogs("kafka admin client", client, (cause) =>
            new KafkaClientError({
              category: "infra",
              reason: inferInfraReason(cause),
              client: "admin",
              operation: "close",
              retryable: false,
              cause
            })
          )
      );

      const producer = Effect.acquireRelease(
        Effect.sync(
          () =>
            new Producer<string, string, string, string>({
              clientId: `${config.clientId}-producer`,
              bootstrapBrokers: [...config.brokers],
              serializers: {
                key: stringSerializer,
                value: stringSerializer
              }
            })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new KafkaClientError({
                category: "infra",
                reason: inferInfraReason(cause),
                client: "producer",
                operation: "create",
                retryable: false,
                cause
              })
          ),
          Effect.tap(() => Effect.logInfo("kafka producer client started"))
        ),
        (client) =>
          closeWithLogs("kafka producer client", client, (cause) =>
            new KafkaClientError({
              category: "infra",
              reason: inferInfraReason(cause),
              client: "producer",
              operation: "close",
              retryable: false,
              cause
            })
          )
      );

      const consumer = Effect.acquireRelease(
        Effect.sync(
          () =>
            new Consumer<string, string, string, string>({
              groupId: config.groupId,
              clientId: `${config.clientId}-consumer`,
              bootstrapBrokers: [...config.brokers],
              deserializers: {
                key: stringDeserializer,
                value: stringDeserializer
              }
            })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new KafkaClientError({
                category: "infra",
                reason: inferInfraReason(cause),
                client: "consumer",
                operation: "create",
                retryable: false,
                cause
              })
          ),
          Effect.tap(() => Effect.logInfo("kafka consumer client started"))
        ),
        (client) =>
          closeWithLogs("kafka consumer client", client, (cause) =>
            new KafkaClientError({
              category: "infra",
              reason: inferInfraReason(cause),
              client: "consumer",
              operation: "close",
              retryable: false,
              cause
            })
          )
      );

      return {
        admin: admin.pipe(
          Effect.map(
            (platformaticAdmin): KafkaAdminClient => ({
              listTopics: () => platformaticAdmin.listTopics(),
              createTopics: (input) => platformaticAdmin.createTopics(input),
              close: () => platformaticAdmin.close()
            })
          )
        ),
        producer: producer.pipe(
          Effect.map(
            (platformaticProducer): KafkaProducerClient => ({
              send: (input) => platformaticProducer.send(input),
              close: () => platformaticProducer.close()
            })
          )
        ),
        consumer: consumer.pipe(
          Effect.map(
            (platformaticConsumer): KafkaConsumerClient => ({
              consume: async (input) => {
                const stream = await platformaticConsumer.consume(input);
                return new PlatformaticMessagesStream(stream as never);
              },
              close: () => platformaticConsumer.close()
            })
          )
        )
      } satisfies KafkaClientFactoryShape;
    })
  );
}
