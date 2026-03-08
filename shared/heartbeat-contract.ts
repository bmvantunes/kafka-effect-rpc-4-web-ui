import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export const HEARTBEAT_GROUP_DIMENSIONS = [
  "region",
  "system",
  "appName",
  "hostname",
  "processName"
] as const;
export type HeartbeatGroupDimension =
  (typeof HEARTBEAT_GROUP_DIMENSIONS)[number];

export const HeartbeatGroupDimensionSchema = Schema.Union([
  Schema.Literal("region"),
  Schema.Literal("system"),
  Schema.Literal("appName"),
  Schema.Literal("hostname"),
  Schema.Literal("processName")
]);

export const HeartbeatIdentity = Schema.Struct({
  region: Schema.String,
  system: Schema.String,
  appName: Schema.String,
  hostname: Schema.String,
  processName: Schema.String
});
export type HeartbeatIdentity = Schema.Schema.Type<typeof HeartbeatIdentity>;

export const HeartbeatPayload = Schema.Struct({
  timestamp: Schema.Number,
  region: Schema.String,
  system: Schema.String,
  appName: Schema.String,
  hostname: Schema.String,
  processName: Schema.String
});
export type HeartbeatPayload = Schema.Schema.Type<typeof HeartbeatPayload>;

export const HEARTBEAT_STALE_AFTER_MS = 10_000;
const HEARTBEAT_KEY_VERSION = "heartbeat.v1";
const HEARTBEAT_QUERY_KEY_VERSION = "heartbeat-query.v1";

const encodeKeyPart = (name: string, value: string): string =>
  `${name}=${encodeURIComponent(value)}`;

const decodeKeyPart = (
  segment: string,
  expectedName: string
): string => {
  const prefix = `${expectedName}=`;

  if (!segment.startsWith(prefix)) {
    throw new Error(`heartbeat key segment ${expectedName} is missing`);
  }

  return decodeURIComponent(segment.slice(prefix.length));
};

const normalizeFilterValues = (
  values: ReadonlyArray<string> | null
): ReadonlyArray<string> | null => {
  if (values === null || values.length === 0) {
    return null;
  }

  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

export const isHeartbeatHealthy = (
  timestamp: number,
  now = Date.now()
): boolean => Number.isFinite(timestamp) && now - timestamp <= HEARTBEAT_STALE_AFTER_MS;

export const encodeHeartbeatKey = (identity: HeartbeatIdentity): string =>
  [
    HEARTBEAT_KEY_VERSION,
    encodeKeyPart("region", identity.region),
    encodeKeyPart("system", identity.system),
    encodeKeyPart("appName", identity.appName),
    encodeKeyPart("hostname", identity.hostname),
    encodeKeyPart("processName", identity.processName)
  ].join("|");

export const decodeHeartbeatKey = (raw: unknown): HeartbeatIdentity => {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("heartbeat key must be a non-empty string");
  }

  if (raw.startsWith("{")) {
    const parsed = JSON.parse(raw) as unknown;
    return Schema.decodeUnknownSync(HeartbeatIdentity)(parsed);
  }

  const parts = raw.split("|");

  if (parts.length !== 6 || parts[0] !== HEARTBEAT_KEY_VERSION) {
    throw new Error("heartbeat key has invalid format");
  }

  return {
    region: decodeKeyPart(parts[1]!, "region"),
    system: decodeKeyPart(parts[2]!, "system"),
    appName: decodeKeyPart(parts[3]!, "appName"),
    hostname: decodeKeyPart(parts[4]!, "hostname"),
    processName: decodeKeyPart(parts[5]!, "processName")
  };
};

export const HeartbeatGroupFiltersSchema = Schema.Struct({
  region: Schema.NullOr(Schema.Array(Schema.String)),
  system: Schema.NullOr(Schema.Array(Schema.String)),
  appName: Schema.NullOr(Schema.Array(Schema.String)),
  hostname: Schema.NullOr(Schema.Array(Schema.String)),
  processName: Schema.NullOr(Schema.Array(Schema.String))
});
export type HeartbeatGroupFilters = Schema.Schema.Type<typeof HeartbeatGroupFiltersSchema>;

export const EMPTY_HEARTBEAT_GROUP_FILTERS: HeartbeatGroupFilters = {
  region: null,
  system: null,
  appName: null,
  hostname: null,
  processName: null
};

export const HeartbeatGroupQuerySchema = Schema.Struct({
  groupBy: HeartbeatGroupDimensionSchema,
  filters: HeartbeatGroupFiltersSchema,
  childGroupBy: Schema.NullOr(HeartbeatGroupDimensionSchema)
});
export type HeartbeatGroupQuery = Schema.Schema.Type<typeof HeartbeatGroupQuerySchema>;

export const encodeHeartbeatGroupQueryKey = (
  query: HeartbeatGroupQuery
): string =>
  [
    HEARTBEAT_QUERY_KEY_VERSION,
    encodeKeyPart("groupBy", query.groupBy),
    encodeKeyPart("childGroupBy", query.childGroupBy ?? "*"),
    encodeKeyPart(
      "region",
      normalizeFilterValues(query.filters.region)?.join(",") ?? "*"
    ),
    encodeKeyPart(
      "system",
      normalizeFilterValues(query.filters.system)?.join(",") ?? "*"
    ),
    encodeKeyPart(
      "appName",
      normalizeFilterValues(query.filters.appName)?.join(",") ?? "*"
    ),
    encodeKeyPart(
      "hostname",
      normalizeFilterValues(query.filters.hostname)?.join(",") ?? "*"
    ),
    encodeKeyPart(
      "processName",
      normalizeFilterValues(query.filters.processName)?.join(",") ?? "*"
    )
  ].join("|");

export const HeartbeatGroupChildSchema = Schema.Struct({
  key: Schema.String,
  minTimestamp: Schema.Number,
  maxTimestamp: Schema.Number,
  count: Schema.Number
});
export type HeartbeatGroupChild = Schema.Schema.Type<typeof HeartbeatGroupChildSchema>;

export const HeartbeatGroupSchema = Schema.Struct({
  key: Schema.String,
  minTimestamp: Schema.Number,
  maxTimestamp: Schema.Number,
  count: Schema.Number,
  children: Schema.Array(HeartbeatGroupChildSchema)
});
export type HeartbeatGroup = Schema.Schema.Type<typeof HeartbeatGroupSchema>;

export const HeartbeatGroupSnapshotEventSchema = Schema.Struct({
  type: Schema.Literal("snapshot"),
  emittedAt: Schema.Number,
  groups: Schema.Array(HeartbeatGroupSchema)
});
export type HeartbeatGroupSnapshotEvent = Schema.Schema.Type<
  typeof HeartbeatGroupSnapshotEventSchema
>;

export const HeartbeatGroupUpsertEventSchema = Schema.Struct({
  type: Schema.Literal("upsert"),
  emittedAt: Schema.Number,
  group: HeartbeatGroupSchema
});
export type HeartbeatGroupUpsertEvent = Schema.Schema.Type<
  typeof HeartbeatGroupUpsertEventSchema
>;

export const HeartbeatGroupDeleteEventSchema = Schema.Struct({
  type: Schema.Literal("delete"),
  emittedAt: Schema.Number,
  key: Schema.String
});
export type HeartbeatGroupDeleteEvent = Schema.Schema.Type<
  typeof HeartbeatGroupDeleteEventSchema
>;

export const HeartbeatGroupEventSchema = Schema.Union([
  HeartbeatGroupSnapshotEventSchema,
  HeartbeatGroupUpsertEventSchema,
  HeartbeatGroupDeleteEventSchema
]);
export type HeartbeatGroupEvent = Schema.Schema.Type<typeof HeartbeatGroupEventSchema>;

export const HeartbeatServerStatusSchema = Schema.Struct({
  status: Schema.String,
  ready: Schema.Boolean,
  consumerState: Schema.String,
  topic: Schema.String,
  wsPort: Schema.Number,
  wsPath: Schema.String,
  activeSubscriptions: Schema.Number,
  regions: Schema.Number,
  healthyRegions: Schema.Number,
  staleRegions: Schema.Number,
  systems: Schema.Number,
  healthySystems: Schema.Number,
  staleSystems: Schema.Number,
  apps: Schema.Number,
  healthyApps: Schema.Number,
  staleApps: Schema.Number,
  hostInstances: Schema.Number,
  processInstances: Schema.Number,
  staleAfterMs: Schema.Number,
  lastHeartbeatAt: Schema.NullOr(Schema.Number)
});
export type HeartbeatServerStatus = Schema.Schema.Type<typeof HeartbeatServerStatusSchema>;

export const SubscribeGroupsRpc = Rpc.make("SubscribeGroups", {
  payload: HeartbeatGroupQuerySchema,
  success: HeartbeatGroupEventSchema,
  stream: true
});

export const HeartbeatRpcGroup = RpcGroup.make(SubscribeGroupsRpc);
