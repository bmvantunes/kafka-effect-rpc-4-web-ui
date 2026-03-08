import fs from "node:fs";
import path from "node:path";
import { Effect, Layer, ServiceMap } from "effect";
import { KafkaConfig } from "../config/kafka-config";
import type { KafkaTelemetrySnapshot } from "./kafka-telemetry-service";

export interface KafkaTelemetryExporterShape {
  readonly exportSnapshot: (snapshot: KafkaTelemetrySnapshot) => Effect.Effect<void>;
}

export class KafkaTelemetryExporter extends ServiceMap.Service<
  KafkaTelemetryExporter,
  KafkaTelemetryExporterShape
>()("kafka/KafkaTelemetryExporter") {
  static readonly Live = Layer.effect(
    KafkaTelemetryExporter,
    Effect.gen(function* () {
      const config = yield* KafkaConfig;

      const exportSnapshot = (snapshot: KafkaTelemetrySnapshot) =>
        config.telemetryExporter === "console"
          ? Effect.logInfo("kafka telemetry export", snapshot)
          : Effect.sync(() => {
              const target = path.resolve(config.telemetryExportPath);
              fs.mkdirSync(path.dirname(target), { recursive: true });
              fs.appendFileSync(
                target,
                `${JSON.stringify({ ts: new Date().toISOString(), ...snapshot })}\n`,
                "utf8"
              );
            });

      return {
        exportSnapshot
      } satisfies KafkaTelemetryExporterShape;
    })
  );
}
