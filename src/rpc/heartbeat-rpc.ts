import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export const RegionSnapshotSchema = Schema.Struct({
  region: Schema.String,
  minTimestamp: Schema.Number,
  systems: Schema.Array(
    Schema.Struct({
      system: Schema.String,
      timestamp: Schema.Number
    })
  )
});
export type RegionSnapshot = Schema.Schema.Type<typeof RegionSnapshotSchema>;

export const HeartbeatSnapshotEventSchema = Schema.Struct({
  type: Schema.Literal("snapshot"),
  emittedAt: Schema.Number,
  regions: Schema.Array(RegionSnapshotSchema)
});
export type HeartbeatSnapshotEvent = Schema.Schema.Type<typeof HeartbeatSnapshotEventSchema>;

export const HeartbeatUpdateEventSchema = Schema.Struct({
  type: Schema.Literal("update"),
  emittedAt: Schema.Number,
  region: Schema.String,
  system: Schema.String,
  timestamp: Schema.Number,
  regionMinTimestamp: Schema.Number
});
export type HeartbeatUpdateEvent = Schema.Schema.Type<typeof HeartbeatUpdateEventSchema>;

export const HeartbeatEventSchema = Schema.Union(
  [HeartbeatSnapshotEventSchema, HeartbeatUpdateEventSchema]
);
export type HeartbeatEvent = Schema.Schema.Type<typeof HeartbeatEventSchema>;

export const HeartbeatServerStatusSchema = Schema.Struct({
  status: Schema.String,
  ready: Schema.Boolean,
  consumerState: Schema.String,
  topic: Schema.String,
  wsPort: Schema.Number,
  wsPath: Schema.String,
  connectedClients: Schema.Number,
  regions: Schema.Number,
  systems: Schema.Number,
  lastHeartbeatAt: Schema.NullOr(Schema.Number)
});
export type HeartbeatServerStatus = Schema.Schema.Type<typeof HeartbeatServerStatusSchema>;

export const SubscribeHeartbeatsRpc = Rpc.make("SubscribeHeartbeats", {
  payload: Schema.Null,
  success: HeartbeatEventSchema,
  stream: true
});

export const HeartbeatRpcGroup = RpcGroup.make(SubscribeHeartbeatsRpc);
