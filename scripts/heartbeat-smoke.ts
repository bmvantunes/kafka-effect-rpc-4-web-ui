import * as NodeSocket from "@effect/platform-node/NodeSocket";
import { Effect, Queue } from "effect";
import * as Layer from "effect/Layer";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { KafkaConfig } from "../src/config/kafka-config";
import { provideKafkaRuntime } from "../src/layers/kafka-runtime";
import {
  HeartbeatRpcGroup,
  type HeartbeatServerStatus,
  type HeartbeatSnapshotEvent
} from "../src/rpc/heartbeat-rpc";
import { runMain } from "../src/runtime/run-main";

const HeartbeatSmoke = provideKafkaRuntime(Effect.gen(function* () {
  const config = yield* KafkaConfig;
  const baseUrl = `http://127.0.0.1:${config.rpcWsPort}`;
  const wsUrl = `ws://127.0.0.1:${config.rpcWsPort}${config.rpcWsPath}`;

  const healthResponse = yield* Effect.tryPromise({
    try: () => fetch(`${baseUrl}/health`),
    catch: (cause) => cause
  });

  if (!healthResponse.ok) {
    return yield* Effect.fail(
      new Error(`/health returned ${healthResponse.status}`)
    );
  }

  const health = (yield* Effect.tryPromise({
    try: () => healthResponse.json() as Promise<HeartbeatServerStatus>,
    catch: (cause) => cause
  })) as HeartbeatServerStatus;

  const readyResponse = yield* Effect.tryPromise({
    try: () => fetch(`${baseUrl}/ready`),
    catch: (cause) => cause
  });

  if (!readyResponse.ok) {
    return yield* Effect.fail(
      new Error(`/ready returned ${readyResponse.status}`)
    );
  }

  const snapshot = yield* Effect.scoped(
    Effect.gen(function* () {
      const client = yield* RpcClient.make(HeartbeatRpcGroup).pipe(
        Effect.provide(
          RpcClient.layerProtocolSocket().pipe(
            Layer.provideMerge(NodeSocket.layerWebSocket(wsUrl)),
            Layer.provideMerge(RpcSerialization.layerJson)
          )
        )
      );

      const queue = yield* client.SubscribeHeartbeats(null, {
        asQueue: true
      });
      const first = yield* Queue.take(queue);

      if (first.type !== "snapshot") {
        return yield* Effect.fail(
          new Error(`expected an initial snapshot event, received ${first.type}`)
        );
      }

      return first as HeartbeatSnapshotEvent;
    })
  );

  yield* Effect.logInfo("heartbeat smoke probe passed", {
    baseUrl,
    wsUrl,
    health,
    snapshot
  });
}));

runMain(HeartbeatSmoke);
