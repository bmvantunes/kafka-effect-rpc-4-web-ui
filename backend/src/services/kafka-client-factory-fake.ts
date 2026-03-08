import { Effect, Layer, Scope } from "effect";
import { KafkaClientFactory } from "./kafka-client-factory-service";
import type {
  KafkaAdminClient,
  KafkaConsumerClient,
  KafkaMessageEnvelope,
  KafkaMessagesStream,
  KafkaProducerClient
} from "./kafka-client-types";

class FakeMessagesStream implements KafkaMessagesStream {
  private closed = false;

  constructor(
    private readonly topic: string,
    private readonly store: Map<string, KafkaMessageEnvelope[]>
  ) {}

  async close(): Promise<void> {
    this.closed = true;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<KafkaMessageEnvelope> {
    let index = 0;

    while (!this.closed) {
      const list = this.store.get(this.topic) ?? [];

      while (index < list.length) {
        yield list[index++]!;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

export const FakeKafkaClientFactoryLive = Layer.effect(
  KafkaClientFactory,
  Effect.sync(() => {
    const topics = new Set<string>();
    const store = new Map<string, KafkaMessageEnvelope[]>();

    const admin: KafkaAdminClient = {
      async listTopics() {
        return [...topics];
      },
      async createTopics(input) {
        for (const topic of input.topics) {
          topics.add(topic);
          if (!store.has(topic)) {
            store.set(topic, []);
          }
        }
      },
      async close() {
        return;
      }
    };

    const producer: KafkaProducerClient = {
      async send(input) {
        for (const message of input.messages) {
          if (!topics.has(message.topic)) {
            throw new Error(`Unknown topic '${message.topic}' in fake broker`);
          }
          const topicStore = store.get(message.topic)!;
          topicStore.push({
            topic: message.topic,
            partition: 0,
            offset: BigInt(topicStore.length),
            key: message.key,
            value: message.value
          });
        }
      },
      async close() {
        return;
      }
    };

    const consumer: KafkaConsumerClient = {
      async consume(input) {
        const topic = input.topics[0]!;
        if (!topics.has(topic)) {
          throw new Error(`Unknown topic '${topic}' in fake broker`);
        }
        return new FakeMessagesStream(topic, store);
      },
      async close() {
        return;
      }
    };

    return {
      admin: Effect.succeed(admin) as Effect.Effect<KafkaAdminClient, never, Scope.Scope>,
      producer: Effect.succeed(producer) as Effect.Effect<KafkaProducerClient, never, Scope.Scope>,
      consumer: Effect.succeed(consumer) as Effect.Effect<KafkaConsumerClient, never, Scope.Scope>
    };
  })
);
