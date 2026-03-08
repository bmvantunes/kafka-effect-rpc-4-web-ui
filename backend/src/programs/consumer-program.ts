import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { Effect, Option, PubSub, Ref, Stream } from "effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { KafkaConfig, type KafkaConfigShape, redactConfig } from "../config/kafka-config";
import { consumerRetryPolicy } from "../config/kafka-policy";
import {
  decodeHeartbeatKey,
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  encodeHeartbeatKey,
  encodeHeartbeatGroupQueryKey,
  HEARTBEAT_GROUP_DIMENSIONS,
  HEARTBEAT_STALE_AFTER_MS,
  isHeartbeatHealthy,
  type HeartbeatGroup,
  type HeartbeatGroupChild,
  type HeartbeatGroupDeleteEvent,
  type HeartbeatGroupDimension,
  type HeartbeatGroupEvent,
  type HeartbeatGroupQuery,
  type HeartbeatGroupSnapshotEvent,
  type HeartbeatGroupUpsertEvent,
  type HeartbeatIdentity,
  type HeartbeatPayload,
  HeartbeatRpcGroup,
  type HeartbeatServerStatus
} from "../rpc/heartbeat-rpc";
import { KafkaConsumerError, inferInfraReason } from "../errors/kafka-errors";
import { provideKafkaRuntime } from "../layers/kafka-runtime";
import { runMain } from "../runtime/run-main";
import { KafkaAdminService } from "../services/kafka-admin-service";
import { KafkaClientFactory } from "../services/kafka-client-factory-service";
import type { KafkaMessagesStream } from "../services/kafka-client-types";

type ConsumerState = "starting" | "running" | "reconnecting";

interface RuntimeStatus {
  readonly consumerState: ConsumerState;
  readonly activeSubscriptions: number;
}

interface ProjectionState {
  readonly entriesById: Map<string, HeartbeatPayload>;
  readonly idsByDimension: Map<HeartbeatGroupDimension, Map<string, Set<string>>>;
}

interface ProjectionHealthSummary {
  readonly regions: number;
  readonly healthyRegions: number;
  readonly staleRegions: number;
  readonly systems: number;
  readonly healthySystems: number;
  readonly staleSystems: number;
  readonly apps: number;
  readonly healthyApps: number;
  readonly staleApps: number;
  readonly hostInstances: number;
  readonly processInstances: number;
  readonly lastHeartbeatAt: number | null;
}

const makeEmptyProjectionState = (): ProjectionState => ({
  entriesById: new Map<string, HeartbeatPayload>(),
  idsByDimension: new Map(
    HEARTBEAT_GROUP_DIMENSIONS.map((dimension) => [
      dimension,
      new Map<string, Set<string>>()
    ])
  )
});

const decodeHeartbeatPayload = (input: unknown): HeartbeatPayload => {
  if (typeof input !== "object" || input === null) {
    throw new Error("heartbeat payload must be an object");
  }

  const candidate = input as Record<string, unknown>;
  const { timestamp, region, system, appName, hostname, processName } = candidate;

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new Error("heartbeat.timestamp must be a finite number");
  }
  if (typeof region !== "string" || region.length === 0) {
    throw new Error("heartbeat.region must be a non-empty string");
  }
  if (typeof system !== "string" || system.length === 0) {
    throw new Error("heartbeat.system must be a non-empty string");
  }
  if (typeof appName !== "string" || appName.length === 0) {
    throw new Error("heartbeat.appName must be a non-empty string");
  }
  if (typeof hostname !== "string" || hostname.length === 0) {
    throw new Error("heartbeat.hostname must be a non-empty string");
  }
  if (typeof processName !== "string" || processName.length === 0) {
    throw new Error("heartbeat.processName must be a non-empty string");
  }

  return {
    timestamp,
    region,
    system,
    appName,
    hostname,
    processName
  };
};

const heartbeatIdentityFromPayload = (
  heartbeat: HeartbeatPayload
): HeartbeatIdentity => ({
  region: heartbeat.region,
  system: heartbeat.system,
  appName: heartbeat.appName,
  hostname: heartbeat.hostname,
  processName: heartbeat.processName
});

const sameHeartbeatIdentity = (
  left: HeartbeatIdentity,
  right: HeartbeatIdentity
): boolean =>
  left.region === right.region &&
  left.system === right.system &&
  left.appName === right.appName &&
  left.hostname === right.hostname &&
  left.processName === right.processName;

const heartbeatDimensionValue = (
  heartbeat: HeartbeatPayload,
  dimension: HeartbeatGroupDimension
): string => {
  switch (dimension) {
    case "region":
      return heartbeat.region;
    case "system":
      return heartbeat.system;
    case "appName":
      return heartbeat.appName;
    case "hostname":
      return heartbeat.hostname;
    case "processName":
      return heartbeat.processName;
  }
};

const indexProjectionEntry = (
  state: ProjectionState,
  id: string,
  heartbeat: HeartbeatPayload
) => {
  for (const dimension of HEARTBEAT_GROUP_DIMENSIONS) {
    const value = heartbeatDimensionValue(heartbeat, dimension);
    const dimensionIndex = state.idsByDimension.get(dimension)!;
    const ids = dimensionIndex.get(value) ?? new Set<string>();
    ids.add(id);
    dimensionIndex.set(value, ids);
  }
};

const unindexProjectionEntry = (
  state: ProjectionState,
  id: string,
  heartbeat: HeartbeatPayload
) => {
  for (const dimension of HEARTBEAT_GROUP_DIMENSIONS) {
    const value = heartbeatDimensionValue(heartbeat, dimension);
    const dimensionIndex = state.idsByDimension.get(dimension)!;
    const ids = dimensionIndex.get(value);

    if (ids === undefined) {
      continue;
    }

    ids.delete(id);

    if (ids.size === 0) {
      dimensionIndex.delete(value);
    }
  }
};

const upsertProjectionEntry = (
  state: ProjectionState,
  heartbeat: HeartbeatPayload
): ProjectionState => {
  const id = encodeHeartbeatKey(heartbeatIdentityFromPayload(heartbeat));
  const existing = state.entriesById.get(id);

  if (existing === undefined) {
    indexProjectionEntry(state, id, heartbeat);
  }

  state.entriesById.set(id, heartbeat);
  return state;
};

const removeProjectionEntry = (
  state: ProjectionState,
  identity: HeartbeatIdentity
): ProjectionState => {
  const id = encodeHeartbeatKey(identity);
  const existing = state.entriesById.get(id);

  if (existing === undefined) {
    return state;
  }

  state.entriesById.delete(id);
  unindexProjectionEntry(state, id, existing);
  return state;
};

const unionIdSets = (sets: ReadonlyArray<Set<string>>): Set<string> => {
  const result = new Set<string>();

  for (const ids of sets) {
    for (const id of ids) {
      result.add(id);
    }
  }

  return result;
};

const intersectIdSets = (left: Set<string>, right: Set<string>): Set<string> => {
  const result = new Set<string>();
  const [smaller, larger] =
    left.size <= right.size ? [left, right] : [right, left];

  for (const id of smaller) {
    if (larger.has(id)) {
      result.add(id);
    }
  }

  return result;
};

const selectCandidateIds = (
  state: ProjectionState,
  query: HeartbeatGroupQuery
): Iterable<string> => {
  const filteredIdSets = HEARTBEAT_GROUP_DIMENSIONS.flatMap((dimension) => {
    const values = query.filters[dimension];

    if (values === null || values.length === 0) {
      return [];
    }

    const dimensionIndex = state.idsByDimension.get(dimension)!;
    const matchingSets = values
      .map((value) => dimensionIndex.get(value))
      .filter((ids): ids is Set<string> => ids !== undefined);

    return [unionIdSets(matchingSets)];
  });

  if (filteredIdSets.length === 0) {
    return state.entriesById.keys();
  }

  const [head, ...tail] = filteredIdSets.sort((left, right) => left.size - right.size);
  return tail.reduce(intersectIdSets, head);
};

const matchesGroupFilters = (
  heartbeat: HeartbeatPayload,
  query: HeartbeatGroupQuery
): boolean =>
  HEARTBEAT_GROUP_DIMENSIONS.every((dimension) => {
    const allowed = query.filters[dimension];

    if (allowed === null || allowed.length === 0) {
      return true;
    }

    return allowed.includes(heartbeatDimensionValue(heartbeat, dimension));
  });

const aggregateGroups = (
  state: ProjectionState,
  query: HeartbeatGroupQuery
): Array<HeartbeatGroup> => {
  const groups = new Map<
    string,
    {
      minTimestamp: number;
      maxTimestamp: number;
      count: number;
      children: Map<
        string,
        {
          minTimestamp: number;
          maxTimestamp: number;
          count: number;
        }
      >;
    }
  >();

  for (const id of selectCandidateIds(state, query)) {
    const heartbeat = state.entriesById.get(id);

    if (heartbeat === undefined || !matchesGroupFilters(heartbeat, query)) {
      continue;
    }

    const groupKey = heartbeatDimensionValue(heartbeat, query.groupBy);
    const group = groups.get(groupKey) ?? {
      minTimestamp: heartbeat.timestamp,
      maxTimestamp: heartbeat.timestamp,
      count: 0,
      children: new Map<
        string,
        {
          minTimestamp: number;
          maxTimestamp: number;
          count: number;
        }
      >()
    };

    group.minTimestamp = Math.min(group.minTimestamp, heartbeat.timestamp);
    group.maxTimestamp = Math.max(group.maxTimestamp, heartbeat.timestamp);
    group.count += 1;

    if (query.childGroupBy !== null && query.childGroupBy !== query.groupBy) {
      const childKey = heartbeatDimensionValue(heartbeat, query.childGroupBy);
      const child = group.children.get(childKey) ?? {
        minTimestamp: heartbeat.timestamp,
        maxTimestamp: heartbeat.timestamp,
        count: 0
      };

      child.minTimestamp = Math.min(child.minTimestamp, heartbeat.timestamp);
      child.maxTimestamp = Math.max(child.maxTimestamp, heartbeat.timestamp);
      child.count += 1;
      group.children.set(childKey, child);
    }

    groups.set(groupKey, group);
  }

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      minTimestamp: group.minTimestamp,
      maxTimestamp: group.maxTimestamp,
      count: group.count,
      children: Array.from(group.children.entries())
        .map(([childKey, child]) => ({
          key: childKey,
          minTimestamp: child.minTimestamp,
          maxTimestamp: child.maxTimestamp,
          count: child.count
        }) satisfies HeartbeatGroupChild)
        .sort((left, right) => left.key.localeCompare(right.key))
    }) satisfies HeartbeatGroup)
    .sort((left, right) => left.key.localeCompare(right.key));
};

const makeGroupSnapshot = (
  state: ProjectionState,
  query: HeartbeatGroupQuery
): HeartbeatGroupSnapshotEvent => ({
  type: "snapshot",
  emittedAt: Date.now(),
  groups: aggregateGroups(state, query)
});

const toGroupMap = (
  groups: ReadonlyArray<HeartbeatGroup>
): Map<string, HeartbeatGroup> =>
  new Map(groups.map((group) => [group.key, group]));

const sameGroupChildren = (
  left: ReadonlyArray<HeartbeatGroupChild>,
  right: ReadonlyArray<HeartbeatGroupChild>
): boolean =>
  left.length === right.length &&
  left.every((child, index) => {
    const other = right[index];
    return (
      child.key === other?.key &&
      child.minTimestamp === other.minTimestamp &&
      child.maxTimestamp === other.maxTimestamp &&
      child.count === other.count
    );
  });

const sameGroup = (left: HeartbeatGroup, right: HeartbeatGroup): boolean =>
  left.key === right.key &&
  left.minTimestamp === right.minTimestamp &&
  left.maxTimestamp === right.maxTimestamp &&
  left.count === right.count &&
  sameGroupChildren(left.children, right.children);

const diffGroupMaps = (
  previousGroups: Map<string, HeartbeatGroup>,
  nextGroups: Map<string, HeartbeatGroup>
): Array<HeartbeatGroupEvent> => {
  const events: Array<HeartbeatGroupEvent> = [];

  for (const [key, nextGroup] of nextGroups.entries()) {
    const previousGroup = previousGroups.get(key);

    if (previousGroup !== undefined && sameGroup(previousGroup, nextGroup)) {
      continue;
    }

    events.push({
      type: "upsert",
      emittedAt: Date.now(),
      group: nextGroup
    } satisfies HeartbeatGroupUpsertEvent);
  }

  for (const key of previousGroups.keys()) {
    if (nextGroups.has(key)) {
      continue;
    }

    events.push({
      type: "delete",
      emittedAt: Date.now(),
      key
    } satisfies HeartbeatGroupDeleteEvent);
  }

  return events;
};

const projectionLastHeartbeatAt = (state: ProjectionState): number | null => {
  let maxTimestamp: number | null = null;

  for (const heartbeat of state.entriesById.values()) {
    maxTimestamp =
      maxTimestamp === null
        ? heartbeat.timestamp
        : Math.max(maxTimestamp, heartbeat.timestamp);
  }

  return maxTimestamp;
};

const summarizeProjectionHealth = (
  state: ProjectionState,
  now: number
): ProjectionHealthSummary => {
  const regionGroups = aggregateGroups(state, {
    groupBy: "region",
    childGroupBy: null,
    filters: EMPTY_HEARTBEAT_GROUP_FILTERS
  });
  const systemGroups = aggregateGroups(state, {
    groupBy: "system",
    childGroupBy: null,
    filters: EMPTY_HEARTBEAT_GROUP_FILTERS
  });
  const appGroups = aggregateGroups(state, {
    groupBy: "appName",
    childGroupBy: null,
    filters: EMPTY_HEARTBEAT_GROUP_FILTERS
  });
  const hostGroups = aggregateGroups(state, {
    groupBy: "hostname",
    childGroupBy: null,
    filters: EMPTY_HEARTBEAT_GROUP_FILTERS
  });

  const healthyRegions = regionGroups.filter((group) =>
    isHeartbeatHealthy(group.minTimestamp, now)
  ).length;
  const healthySystems = systemGroups.filter((group) =>
    isHeartbeatHealthy(group.minTimestamp, now)
  ).length;
  const healthyApps = appGroups.filter((group) =>
    isHeartbeatHealthy(group.minTimestamp, now)
  ).length;

  return {
    regions: regionGroups.length,
    healthyRegions,
    staleRegions: regionGroups.length - healthyRegions,
    systems: systemGroups.length,
    healthySystems,
    staleSystems: systemGroups.length - healthySystems,
    apps: appGroups.length,
    healthyApps,
    staleApps: appGroups.length - healthyApps,
    hostInstances: hostGroups.length,
    processInstances: state.entriesById.size,
    lastHeartbeatAt: projectionLastHeartbeatAt(state)
  };
};

const makeServerStatus = (
  config: KafkaConfigShape,
  state: ProjectionState,
  runtimeStatus: RuntimeStatus
): HeartbeatServerStatus => {
  const projection = summarizeProjectionHealth(state, Date.now());

  return {
    status: runtimeStatus.consumerState === "running" ? "ok" : "degraded",
    ready: runtimeStatus.consumerState === "running",
    consumerState: runtimeStatus.consumerState,
    topic: config.topic,
    wsPort: config.rpcWsPort,
    wsPath: config.rpcWsPath,
    activeSubscriptions: runtimeStatus.activeSubscriptions,
    regions: projection.regions,
    healthyRegions: projection.healthyRegions,
    staleRegions: projection.staleRegions,
    systems: projection.systems,
    healthySystems: projection.healthySystems,
    staleSystems: projection.staleSystems,
    apps: projection.apps,
    healthyApps: projection.healthyApps,
    staleApps: projection.staleApps,
    hostInstances: projection.hostInstances,
    processInstances: projection.processInstances,
    staleAfterMs: HEARTBEAT_STALE_AFTER_MS,
    lastHeartbeatAt: projection.lastHeartbeatAt
  };
};

const getServerStatus = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<ProjectionState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const runtimeStatus = yield* Ref.get(runtimeStatusRef);
    return makeServerStatus(config, state, runtimeStatus);
  });

const isInvalidMessageError = (error: unknown): error is KafkaConsumerError =>
  error instanceof KafkaConsumerError &&
  error.category === "domain" &&
  error.reason === "InvalidMessage";

const shouldLogInvalidMessage = (offset: unknown): boolean =>
  typeof offset !== "bigint" || offset % 500n === 0n;

const healthResponse = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<ProjectionState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>,
  readinessOnly: boolean
) =>
  Effect.gen(function* () {
    const status = yield* getServerStatus(config, stateRef, runtimeStatusRef);
    return yield* HttpServerResponse.json(status, {
      status: readinessOnly && !status.ready ? 503 : 200
    });
  });

const closeStreamWithLogs = (
  stream: KafkaMessagesStream,
  topic: string
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("kafka message stream shutdown starting", { topic });

    const result = yield* Effect.tryPromise({
      try: () => stream.close(),
      catch: (cause) => cause
    }).pipe(
      Effect.timeoutOption("5 seconds"),
      Effect.catchIf(
        (_error): _error is unknown => true,
        (error) =>
          Effect.logWarning("kafka message stream shutdown failed", {
            topic,
            error
          }).pipe(Effect.as(Option.none<void>()))
      )
    );

    if (Option.isSome(result)) {
      yield* Effect.logInfo("kafka message stream shutdown completed", { topic });
      return;
    }

    yield* Effect.logWarning("kafka message stream shutdown timed out", { topic });
  }).pipe(Effect.orElseSucceed(() => undefined));

const rpcServerLayer = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<ProjectionState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>,
  updateTicks: PubSub.PubSub<void>
) => {
  const handlers = HeartbeatRpcGroup.toLayer(
    HeartbeatRpcGroup.of({
      SubscribeGroups: (query) =>
        Stream.unwrap(
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            let previousGroups = toGroupMap(aggregateGroups(state, query));
            const runtimeStatus = yield* Ref.updateAndGet(
              runtimeStatusRef,
              (current) => ({
                ...current,
                activeSubscriptions: current.activeSubscriptions + 1
              })
            );

            yield* Effect.logInfo("heartbeat RPC group subscription started", {
              topic: config.topic,
              groupBy: query.groupBy,
              childGroupBy: query.childGroupBy,
              queryKey: encodeHeartbeatGroupQueryKey(query),
              activeSubscriptions: runtimeStatus.activeSubscriptions
            });

            return Stream.make(makeGroupSnapshot(state, query)).pipe(
              Stream.concat(
                Stream.fromPubSub(updateTicks).pipe(
                  Stream.mapEffect(() =>
                    Effect.gen(function* () {
                      const nextState = yield* Ref.get(stateRef);
                      const nextGroups = toGroupMap(
                        aggregateGroups(nextState, query)
                      );
                      const events = diffGroupMaps(previousGroups, nextGroups);
                      previousGroups = nextGroups;
                      return events;
                    })
                  ),
                  Stream.flatMap(Stream.fromIterable)
                )
              ),
              Stream.ensuring(
                Ref.updateAndGet(runtimeStatusRef, (current) => ({
                  ...current,
                  activeSubscriptions: Math.max(
                    0,
                    current.activeSubscriptions - 1
                  )
                })).pipe(
                  Effect.flatMap((nextRuntimeStatus) =>
                    Effect.logInfo("heartbeat RPC group subscription stopped", {
                      topic: config.topic,
                      groupBy: query.groupBy,
                      childGroupBy: query.childGroupBy,
                      activeSubscriptions: nextRuntimeStatus.activeSubscriptions
                    })
                  )
                )
              )
            );
          }).pipe(
            Effect.withSpan("heartbeat.rpc.subscribeGroups", {
              attributes: {
                topic: config.topic,
                wsPath: config.rpcWsPath,
                groupBy: query.groupBy,
                childGroupBy: query.childGroupBy ?? "none"
              }
            })
          )
        )
    })
  );

  const httpRoutes = Layer.mergeAll(
    HttpRouter.add(
      "GET",
      "/health",
      healthResponse(config, stateRef, runtimeStatusRef, false)
    ),
    HttpRouter.add(
      "GET",
      "/ready",
      healthResponse(config, stateRef, runtimeStatusRef, true)
    )
  );

  const appLayer = Layer.mergeAll(
    httpRoutes,
    RpcServer.layerHttp({
      group: HeartbeatRpcGroup,
      path: config.rpcWsPath as HttpRouter.PathInput,
      protocol: "websocket"
    }).pipe(
      Layer.provide(handlers),
      Layer.provide(RpcSerialization.layerJson)
    )
  );

  return HttpRouter.serve(appLayer, {
    disableListenLog: true
  }).pipe(
    Layer.provide(
      NodeHttpServer.layer(createHttpServer, {
        port: config.rpcWsPort
      })
    )
  );
};

const ensurePortAvailable = (port: number) =>
  Effect.tryPromise({
    try: () =>
      new Promise<void>((resolve, reject) => {
        const server = createNetServer();
        server.once("error", reject);
        server.once("listening", () => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
        server.listen(port, "0.0.0.0");
      }),
    catch: (cause) => cause
  }).pipe(
    Effect.tapError((error) =>
      Effect.logError("consumer http/rpc port unavailable", {
        port,
        error
      })
    ),
    Effect.asVoid
  );

const consumeHeartbeats = (
  config: KafkaConfigShape,
  stateRef: Ref.Ref<ProjectionState>,
  runtimeStatusRef: Ref.Ref<RuntimeStatus>,
  updateTicks: PubSub.PubSub<void>
) =>
  Effect.gen(function* () {
    const clients = yield* KafkaClientFactory;
    const retryPolicy = yield* consumerRetryPolicy;
    const consumer = yield* clients.consumer;

    const runOnce = Effect.gen(function* () {
      const stream = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () =>
            consumer.consume({
              topics: [config.topic],
              autocommit: true,
              fallbackMode: "earliest"
            }),
          catch: (cause) =>
            new KafkaConsumerError({
              category: "infra",
              reason: inferInfraReason(cause),
              operation: "consume-start",
              topic: config.topic,
              retryable: true,
              cause
            })
        }),
        (messages) => closeStreamWithLogs(messages, config.topic)
      );

      yield* Ref.update(runtimeStatusRef, (current): RuntimeStatus => ({
        ...current,
        consumerState: "running"
      }));

      yield* Stream.fromAsyncIterable(
        stream,
        (cause) =>
          new KafkaConsumerError({
            category: "infra",
            reason: inferInfraReason(cause),
            operation: "consume-stream",
            topic: config.topic,
            retryable: true,
            cause
          })
      ).pipe(
        Stream.runForEach((message) =>
          Effect.gen(function* () {
            const messageValue = message.value;

            if (messageValue === null || messageValue === "null") {
              const identity = yield* Effect.try({
                try: () => decodeHeartbeatKey(message.key),
                catch: (cause) =>
                  new KafkaConsumerError({
                    category: "domain",
                    reason: "InvalidMessage",
                    operation: "consume-stream",
                    topic: config.topic,
                    retryable: false,
                    cause
                  })
              });

              const nextState = yield* Ref.updateAndGet(stateRef, (state) =>
                removeProjectionEntry(state, identity)
              );

              yield* Effect.logInfo("heartbeat tombstone applied", {
                topic: config.topic,
                key: message.key,
                region: identity.region,
                system: identity.system,
                appName: identity.appName,
                hostname: identity.hostname,
                processName: identity.processName,
                remainingProcessInstances: nextState.entriesById.size
              });

              yield* PubSub.publish(updateTicks, undefined).pipe(
                Effect.withSpan("heartbeat.consumer.tombstone", {
                  attributes: {
                    topic: config.topic,
                    region: identity.region,
                    system: identity.system,
                    appName: identity.appName,
                    hostname: identity.hostname,
                    processName: identity.processName
                  }
                })
              );
              return;
            }

            const parsed = yield* Effect.try({
              try: () => JSON.parse(messageValue),
              catch: (cause) =>
                new KafkaConsumerError({
                  category: "domain",
                  reason: "InvalidMessage",
                  operation: "consume-stream",
                  topic: config.topic,
                  retryable: false,
                  cause
                })
            });

            const heartbeat = yield* Effect.try({
              try: () => decodeHeartbeatPayload(parsed),
              catch: (cause) =>
                new KafkaConsumerError({
                  category: "domain",
                  reason: "InvalidMessage",
                  operation: "consume-stream",
                  topic: config.topic,
                  retryable: false,
                  cause
                })
            });

            const payloadIdentity = heartbeatIdentityFromPayload(heartbeat);
            const messageIdentity = yield* Effect.try({
              try: () =>
                message.key
                  ? decodeHeartbeatKey(message.key)
                  : payloadIdentity,
              catch: (cause) =>
                new KafkaConsumerError({
                  category: "domain",
                  reason: "InvalidMessage",
                  operation: "consume-stream",
                  topic: config.topic,
                  retryable: false,
                  cause
                })
            });

            if (!sameHeartbeatIdentity(payloadIdentity, messageIdentity)) {
              yield* Effect.fail(
                new KafkaConsumerError({
                  category: "domain",
                  reason: "InvalidMessage",
                  operation: "consume-stream",
                  topic: config.topic,
                  retryable: false,
                  cause: new Error("heartbeat key does not match payload identity")
                })
              );
            }

            yield* Ref.update(stateRef, (state) => upsertProjectionEntry(state, heartbeat));

            yield* PubSub.publish(updateTicks, undefined).pipe(
              Effect.withSpan("heartbeat.consumer.upsert", {
                attributes: {
                  topic: config.topic,
                  region: heartbeat.region,
                  system: heartbeat.system,
                  appName: heartbeat.appName,
                  hostname: heartbeat.hostname,
                  processName: heartbeat.processName
                }
              })
            );
          }).pipe(
            Effect.catchIf(isInvalidMessageError, (error) =>
              shouldLogInvalidMessage(message.offset)
                ? Effect.logWarning("heartbeat message skipped", {
                    topic: config.topic,
                    key: message.key,
                    offset: message.offset,
                    cause: String(error.cause ?? "invalid heartbeat message")
                  })
                : Effect.void
            )
          )
        )
      );
    });

    yield* runOnce.pipe(
      Effect.tapError(() =>
        Ref.update(runtimeStatusRef, (current): RuntimeStatus => ({
          ...current,
          consumerState: "reconnecting"
        }))
      ),
      Effect.retry(retryPolicy)
    );
  });

export const ConsumerProgram = Effect.gen(function* () {
  const config = yield* KafkaConfig;
  const admin = yield* KafkaAdminService;
  const stateRef = yield* Ref.make(makeEmptyProjectionState());
  const runtimeStatusRef = yield* Ref.make<RuntimeStatus>({
    consumerState: "starting",
    activeSubscriptions: 0
  });
  const updateTicks = yield* PubSub.unbounded<void>();

  yield* Effect.logInfo("effective kafka config", redactConfig(config));
  yield* admin.ensureTopic(config.topic);
  yield* ensurePortAvailable(config.rpcWsPort);

  yield* Effect.logInfo("heartbeat HTTP/RPC server ready", {
    topic: config.topic,
    brokers: config.brokers.join(","),
    httpPort: config.rpcWsPort,
    wsPath: config.rpcWsPath,
    healthPath: "/health",
    readyPath: "/ready"
  });

  yield* Effect.all(
    [
      Layer.launch(rpcServerLayer(config, stateRef, runtimeStatusRef, updateTicks)),
      consumeHeartbeats(config, stateRef, runtimeStatusRef, updateTicks)
    ],
    { concurrency: "unbounded" }
  );
});

export const makeConsumerRuntime = <ConfigE, ConfigR>(
  configLayer?: Layer.Layer<KafkaConfig, ConfigE, ConfigR>
) =>
  provideKafkaRuntime(
    Effect.scoped(ConsumerProgram),
    (configLayer ?? KafkaConfig.Live) as Layer.Layer<KafkaConfig, ConfigE, ConfigR>
  );

export const ConsumerRuntime = provideKafkaRuntime(Effect.scoped(ConsumerProgram));

export const runConsumerMain = () => runMain(ConsumerRuntime);
