export interface KafkaMessageEnvelope {
  readonly topic: string;
  readonly partition: number;
  readonly offset: bigint;
  readonly key: string | null;
  readonly value: string | null;
}

export interface KafkaMessagesStream extends AsyncIterable<KafkaMessageEnvelope> {
  close(): Promise<void>;
}

export interface KafkaAdminClient {
  listTopics(): Promise<string[]>;
  createTopics(input: { topics: string[]; partitions: number; replicas: number }): Promise<unknown>;
  close(): Promise<void>;
}

export interface KafkaProducerClient {
  send(input: {
    acks: number;
    messages: Array<{ topic: string; key: string; value: string | null }>;
  }): Promise<unknown>;
  close(): Promise<void>;
}

export interface KafkaConsumerClient {
  consume(input: {
    topics: string[];
    autocommit: boolean;
    fallbackMode: "earliest" | "latest" | "fail";
  }): Promise<KafkaMessagesStream>;
  close(): Promise<void>;
}
