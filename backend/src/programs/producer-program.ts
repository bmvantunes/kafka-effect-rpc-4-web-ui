import { Effect, Schedule } from "effect";
import { KafkaConfig, redactConfig } from "../config/kafka-config";
import { encodeHeartbeatKey } from "../domain/heartbeat";
import { provideKafkaRuntime } from "../layers/kafka-runtime";
import { runMain } from "../runtime/run-main";
import { KafkaAdminService } from "../services/kafka-admin-service";
import { KafkaProducerService } from "../services/kafka-producer-service";

const REGIONS = ["USA", "Europe", "Asia"] as const;
const SYSTEMS = ["Gmail", "Drive", "Calendar"] as const;
const APPS_BY_SYSTEM = {
  Gmail: ["gmail-api", "gmail-worker"],
  Drive: ["drive-api", "drive-worker"],
  Calendar: ["calendar-api", "calendar-worker"]
} as const satisfies Record<(typeof SYSTEMS)[number], ReadonlyArray<string>>;
const HOSTS = ["host-1", "host-2"] as const;
const PROCESSES = ["process-stuff", "process-another-stuff"] as const;

const TOPOLOGY = REGIONS.flatMap((region) =>
  SYSTEMS.flatMap((system) =>
    HOSTS.flatMap((host) =>
      APPS_BY_SYSTEM[system].flatMap((appName) =>
        PROCESSES.map((processName) => ({
          region,
          system,
          appName,
          hostname: `${system.toLowerCase()}-${region.toLowerCase()}-${host}`,
          processName
        }))
      )
    )
  )
);

const ProducerProgram = Effect.gen(function* () {
  const config = yield* KafkaConfig;
  const admin = yield* KafkaAdminService;
  const producer = yield* KafkaProducerService;

  yield* Effect.logInfo("effective kafka config", redactConfig(config));
  yield* admin.ensureTopic(config.topic);

  yield* Effect.logInfo("producer ready", {
    brokers: config.brokers.join(","),
    topic: config.topic,
    interval: config.producerInterval,
    messagesPerTick: TOPOLOGY.length
  });

  const sendBatch = Effect.gen(function* () {
    const timestamp = Date.now();

    for (let index = 0; index < TOPOLOGY.length; index += 1) {
      const heartbeat = TOPOLOGY[index]!;
      const key = encodeHeartbeatKey(heartbeat);
      const payload = JSON.stringify({
        ...heartbeat,
        timestamp
      });

      yield* producer.send(config.topic, key, index + 1, payload);
    }

    yield* Effect.logDebug("producer sent heartbeat batch", {
      topic: config.topic,
      timestamp,
      messages: TOPOLOGY.length
    });
  });

  yield* sendBatch.pipe(Effect.repeat(Schedule.spaced(config.producerInterval)));
});

export const ProducerRuntime = provideKafkaRuntime(Effect.scoped(ProducerProgram));

export const runProducerMain = () => runMain(ProducerRuntime);
