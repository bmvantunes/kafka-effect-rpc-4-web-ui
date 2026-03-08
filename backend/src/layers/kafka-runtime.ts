import { Effect } from "effect";
import type * as Layer from "effect/Layer";
import { KafkaConfig } from "../config/kafka-config";
import { KafkaAdminService } from "../services/kafka-admin-service";
import { KafkaClientFactory } from "../services/kafka-client-factory-service";
import { KafkaConsumerService } from "../services/kafka-consumer-service";
import { KafkaProducerService } from "../services/kafka-producer-service";

export function provideKafkaRuntime<A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E | unknown, never>;

export function provideKafkaRuntime<A, E, R, ConfigE, ConfigR>(
  effect: Effect.Effect<A, E, R>,
  configLayer: Layer.Layer<KafkaConfig, ConfigE, ConfigR>
): Effect.Effect<A, E | ConfigE, ConfigR>;

export function provideKafkaRuntime(
  effect: Effect.Effect<any, any, any>,
  configLayer: unknown = KafkaConfig.Live
) {
  return effect.pipe(
    Effect.provide(KafkaConsumerService.Live),
    Effect.provide(KafkaProducerService.Live),
    Effect.provide(KafkaAdminService.Live),
    Effect.provide(KafkaClientFactory.Live),
    Effect.provide(configLayer as never)
  );
}
