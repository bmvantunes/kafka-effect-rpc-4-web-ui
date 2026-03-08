export { KafkaConfig } from "./src/config/kafka-config";
export type { KafkaConfigShape } from "./src/config/kafka-config";

export { KafkaAdminService } from "./src/services/kafka-admin-service";
export type { KafkaAdminServiceShape } from "./src/services/kafka-admin-service";

export { KafkaClientFactory } from "./src/services/kafka-client-factory-service";
export type { KafkaClientFactoryShape } from "./src/services/kafka-client-factory-service";

export { KafkaTelemetryService } from "./src/services/kafka-telemetry-service";
export type {
  KafkaTelemetryServiceShape,
  KafkaTelemetrySnapshot
} from "./src/services/kafka-telemetry-service";

export {
  KafkaConfigError,
  KafkaClientError,
  KafkaAdminError,
  KafkaProducerError,
  KafkaConsumerError
} from "./src/errors/kafka-errors";
