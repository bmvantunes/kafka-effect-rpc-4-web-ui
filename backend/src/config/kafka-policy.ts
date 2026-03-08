import { Effect, Schedule } from "effect";
import { KafkaConfig } from "./kafka-config";

export const consumerRetryPolicy = Effect.gen(function* () {
  const config = yield* KafkaConfig;

  return Schedule.exponential(config.consumerRetryBase).pipe(
    Schedule.compose(Schedule.recurs(config.consumerRetryMaxRetries))
  );
});
