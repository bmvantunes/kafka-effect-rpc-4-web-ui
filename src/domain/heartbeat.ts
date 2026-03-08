import { Schema } from "effect";

export const Region = Schema.String;
export type Region = string;

export const HeartbeatPayload = Schema.Struct({
  timestamp: Schema.Number,
  system: Schema.String,
  region: Region
});
export type HeartbeatPayload = Schema.Schema.Type<typeof HeartbeatPayload>;

export interface RegionSnapshot {
  readonly region: string;
  readonly minTimestamp: number;
  readonly systems: ReadonlyArray<{
    readonly system: string;
    readonly timestamp: number;
  }>;
}

export interface HeartbeatSnapshotEvent {
  readonly type: "snapshot";
  readonly emittedAt: number;
  readonly regions: ReadonlyArray<RegionSnapshot>;
}

export interface HeartbeatUpdateEvent {
  readonly type: "update";
  readonly emittedAt: number;
  readonly region: Region;
  readonly system: string;
  readonly timestamp: number;
  readonly regionMinTimestamp: number;
}

export interface HeartbeatSubscribeEvent {
  readonly type: "subscribe";
}
