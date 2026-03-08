import { Data } from "effect";

export type KafkaInfraReason =
  | "Network"
  | "Protocol"
  | "Timeout"
  | "Serialization"
  | "Resource"
  | "Unknown";

export type KafkaDomainReason = "InvalidConfig" | "InvalidMessage" | "StreamEnded" | "TopicPolicy";

export class KafkaConfigError extends Data.TaggedError("KafkaConfigError")<{
  readonly category: "domain";
  readonly reason: KafkaDomainReason;
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class KafkaClientError extends Data.TaggedError("KafkaClientError")<{
  readonly category: "infra";
  readonly reason: KafkaInfraReason;
  readonly client: "admin" | "producer" | "consumer";
  readonly operation: string;
  readonly retryable: boolean;
  readonly cause?: unknown;
}> {}

export class KafkaAdminError extends Data.TaggedError("KafkaAdminError")<{
  readonly category: "infra" | "domain";
  readonly reason: KafkaInfraReason | KafkaDomainReason;
  readonly operation: "list-topics" | "create-topic" | "ensure-topic";
  readonly topic?: string;
  readonly retryable: boolean;
  readonly cause?: unknown;
}> {}

export class KafkaProducerError extends Data.TaggedError("KafkaProducerError")<{
  readonly category: "infra" | "domain";
  readonly reason: KafkaInfraReason | KafkaDomainReason;
  readonly operation: "send";
  readonly topic: string;
  readonly sequence: number;
  readonly retryable: boolean;
  readonly cause?: unknown;
}> {}

export class KafkaConsumerError extends Data.TaggedError("KafkaConsumerError")<{
  readonly category: "infra" | "domain";
  readonly reason: KafkaInfraReason | KafkaDomainReason;
  readonly operation: "consume-start" | "consume-stream" | "consume-end";
  readonly topic: string;
  readonly retryable: boolean;
  readonly cause?: unknown;
}> {}

export const inferInfraReason = (cause: unknown): KafkaInfraReason => {
  const text = String(cause ?? "").toLowerCase();

  if (text.includes("timeout")) return "Timeout";
  if (text.includes("network") || text.includes("connect") || text.includes("econn")) return "Network";
  if (text.includes("protocol") || text.includes("unsupportedapi") || text.includes("metadata")) return "Protocol";
  if (text.includes("serialize") || text.includes("deserialize") || text.includes("json")) return "Serialization";
  if (text.includes("close") || text.includes("dispose")) return "Resource";

  return "Unknown";
};
