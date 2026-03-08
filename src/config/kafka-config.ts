import { Config, Duration, Effect, Layer, ServiceMap } from "effect";
import { KafkaConfigError } from "../errors/kafka-errors";

const knownKafkaEnv = new Set([
  "KAFKA_BROKERS",
  "KAFKA_TOPIC",
  "KAFKA_GROUP_ID",
  "KAFKA_CLIENT_ID",
  "KAFKA_PRODUCER_INTERVAL",
  "KAFKA_METRICS_INTERVAL",
  "KAFKA_CONSUMER_RETRY_BASE",
  "KAFKA_CONSUMER_RETRY_MAX_RETRIES",
  "KAFKA_STRICT_ENV",
  "KAFKA_TELEMETRY_EXPORTER",
  "KAFKA_TELEMETRY_EXPORT_PATH",
  "KAFKA_RPC_WS_PORT",
  "KAFKA_RPC_WS_PATH"
]);

const csvToList = (value: string): ReadonlyArray<string> =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const RuntimeConfig = Config.all({
  brokers: Config.string("KAFKA_BROKERS").pipe(Config.withDefault("127.0.0.1:9092")),
  topic: Config.string("KAFKA_TOPIC").pipe(Config.withDefault("events")),
  groupId: Config.string("KAFKA_GROUP_ID").pipe(Config.withDefault("effect-v4-group")),
  clientId: Config.string("KAFKA_CLIENT_ID").pipe(Config.withDefault("effect-v4")),
  producerInterval: Config.duration("KAFKA_PRODUCER_INTERVAL").pipe(
    Config.withDefault(Duration.seconds(1))
  ),
  metricsInterval: Config.duration("KAFKA_METRICS_INTERVAL").pipe(
    Config.withDefault(Duration.seconds(15))
  ),
  consumerRetryBase: Config.duration("KAFKA_CONSUMER_RETRY_BASE").pipe(
    Config.withDefault(Duration.millis(250))
  ),
  consumerRetryMaxRetries: Config.int("KAFKA_CONSUMER_RETRY_MAX_RETRIES").pipe(
    Config.withDefault(10)
  ),
  strictEnv: Config.boolean("KAFKA_STRICT_ENV").pipe(Config.withDefault(true)),
  telemetryExporter: Config.string("KAFKA_TELEMETRY_EXPORTER").pipe(Config.withDefault("console")),
  telemetryExportPath: Config.string("KAFKA_TELEMETRY_EXPORT_PATH").pipe(
    Config.withDefault("./telemetry/kafka-metrics.ndjson")
  ),
  rpcWsPort: Config.int("KAFKA_RPC_WS_PORT").pipe(Config.withDefault(3001)),
  rpcWsPath: Config.string("KAFKA_RPC_WS_PATH").pipe(Config.withDefault("/ws"))
});

export interface KafkaConfigShape {
  readonly brokers: ReadonlyArray<string>;
  readonly topic: string;
  readonly groupId: string;
  readonly clientId: string;
  readonly producerInterval: Duration.Duration;
  readonly metricsInterval: Duration.Duration;
  readonly consumerRetryBase: Duration.Duration;
  readonly consumerRetryMaxRetries: number;
  readonly strictEnv: boolean;
  readonly telemetryExporter: "console" | "ndjson";
  readonly telemetryExportPath: string;
  readonly rpcWsPort: number;
  readonly rpcWsPath: string;
}

export const redactConfig = (config: KafkaConfigShape) => ({
  brokers: config.brokers.join(","),
  topic: config.topic,
  groupId: config.groupId,
  clientId: config.clientId,
  producerInterval: config.producerInterval,
  metricsInterval: config.metricsInterval,
  consumerRetryBase: config.consumerRetryBase,
  consumerRetryMaxRetries: config.consumerRetryMaxRetries,
  strictEnv: config.strictEnv,
  telemetryExporter: config.telemetryExporter,
  telemetryExportPath: config.telemetryExportPath,
  rpcWsPort: config.rpcWsPort,
  rpcWsPath: config.rpcWsPath
});

const validateEnvGovernance = (strictEnv: boolean): Effect.Effect<void, KafkaConfigError> =>
  Effect.try({
    try: () => {
      if (!strictEnv) return;

      const unknown = Object.keys(process.env)
        .filter((key) => key.startsWith("KAFKA_"))
        .filter((key) => !knownKafkaEnv.has(key));

      if (unknown.length > 0) {
        throw new KafkaConfigError({
          category: "domain",
          reason: "InvalidConfig",
          message: `Unknown KAFKA_* env keys detected: ${unknown.join(", ")}`,
          field: "KAFKA_*"
        });
      }
    },
    catch: (cause) =>
      typeof cause === "object" &&
      cause !== null &&
      "_tag" in cause &&
      (cause as { _tag: string })._tag === "KafkaConfigError"
        ? (cause as KafkaConfigError)
        : new KafkaConfigError({
            category: "domain",
            reason: "InvalidConfig",
            message: "Failed to validate KAFKA_* env governance",
            cause
          })
  });

export class KafkaConfig extends ServiceMap.Service<KafkaConfig, KafkaConfigShape>()(
  "kafka/KafkaConfig"
) {
  static readonly Live = Layer.effect(
    KafkaConfig,
    RuntimeConfig.asEffect().pipe(
      Effect.mapError(
        (cause) =>
          new KafkaConfigError({
            category: "domain",
            reason: "InvalidConfig",
            message: "Failed to load Kafka config",
            cause
          })
      ),
      Effect.flatMap((config) => {
        const brokers = csvToList(config.brokers);
        if (brokers.length === 0) {
          return Effect.fail(
            new KafkaConfigError({
              category: "domain",
              reason: "InvalidConfig",
              message: "KAFKA_BROKERS resolved to an empty broker list",
              field: "KAFKA_BROKERS"
            })
          );
        }

        if (config.consumerRetryMaxRetries < 0) {
          return Effect.fail(
            new KafkaConfigError({
              category: "domain",
              reason: "InvalidConfig",
              message: "KAFKA_CONSUMER_RETRY_MAX_RETRIES must be >= 0",
              field: "KAFKA_CONSUMER_RETRY_MAX_RETRIES"
            })
          );
        }

        if (config.telemetryExporter !== "console" && config.telemetryExporter !== "ndjson") {
          return Effect.fail(
            new KafkaConfigError({
              category: "domain",
              reason: "InvalidConfig",
              message: "KAFKA_TELEMETRY_EXPORTER must be 'console' or 'ndjson'",
              field: "KAFKA_TELEMETRY_EXPORTER"
            })
          );
        }

        if (config.rpcWsPort < 1 || config.rpcWsPort > 65535) {
          return Effect.fail(
            new KafkaConfigError({
              category: "domain",
              reason: "InvalidConfig",
              message: "KAFKA_RPC_WS_PORT must be between 1 and 65535",
              field: "KAFKA_RPC_WS_PORT"
            })
          );
        }

        if (!config.rpcWsPath.startsWith("/")) {
          return Effect.fail(
            new KafkaConfigError({
              category: "domain",
              reason: "InvalidConfig",
              message: "KAFKA_RPC_WS_PATH must start with '/'",
              field: "KAFKA_RPC_WS_PATH"
            })
          );
        }

        const normalized = {
          ...config,
          brokers,
          telemetryExporter: config.telemetryExporter as "console" | "ndjson"
        } satisfies KafkaConfigShape;

        return validateEnvGovernance(normalized.strictEnv).pipe(Effect.as(normalized));
      })
    )
  );
}
