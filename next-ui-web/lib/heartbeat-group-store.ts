"use client";

import { Effect, Exit, Stream } from "effect";
import * as Fiber from "effect/Fiber";
import { RpcClient } from "effect/unstable/rpc";
import {
  encodeHeartbeatGroupQueryKey,
  type HeartbeatGroup,
  type HeartbeatGroupEvent,
  type HeartbeatGroupQuery
} from "./heartbeat-rpc";
import { HeartbeatRpcGroup } from "./heartbeat-rpc";
import { makeRpcClientLayer } from "./rpc-client-layer";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface HeartbeatGroupStoreSnapshot {
  readonly status: ConnectionStatus;
  readonly groups: ReadonlyArray<HeartbeatGroup>;
}

const RETRY_DELAY = "750 millis";
const STORE_DISPOSE_GRACE_MS = 5_000;

const sortGroups = (groups: ReadonlyArray<HeartbeatGroup>): Array<HeartbeatGroup> =>
  [...groups].sort((left, right) => left.key.localeCompare(right.key));

const applyGroupEvent = (
  currentGroups: ReadonlyArray<HeartbeatGroup>,
  event: HeartbeatGroupEvent
): Array<HeartbeatGroup> => {
  if (event.type === "snapshot") {
    return sortGroups(event.groups);
  }

  if (event.type === "delete") {
    return currentGroups.filter((group) => group.key !== event.key);
  }

  return sortGroups([
    ...currentGroups.filter((group) => group.key !== event.group.key),
    event.group
  ]);
};

class HeartbeatGroupStore {
  private snapshot: HeartbeatGroupStoreSnapshot = {
    status: "connecting",
    groups: []
  };
  private readonly listeners = new Set<() => void>();
  private fiber: ReturnType<typeof Effect.runFork> | null = null;
  private disposeTimer: number | null = null;

  constructor(
    readonly key: string,
    private readonly query: HeartbeatGroupQuery,
    private readonly wsUrl: string
  ) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    if (this.disposeTimer !== null) {
      window.clearTimeout(this.disposeTimer);
      this.disposeTimer = null;
    }

    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.start();
    }

    return () => {
      this.listeners.delete(listener);

      if (this.listeners.size === 0) {
        this.scheduleDispose();
      }
    };
  };

  private publish() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setSnapshot(next: HeartbeatGroupStoreSnapshot) {
    if (
      this.snapshot.status === next.status &&
      this.snapshot.groups === next.groups
    ) {
      return;
    }

    this.snapshot = next;
    this.publish();
  }

  private updateSnapshot(
    updater: (
      current: HeartbeatGroupStoreSnapshot
    ) => HeartbeatGroupStoreSnapshot
  ) {
    this.setSnapshot(updater(this.snapshot));
  }

  private start() {
    if (this.fiber !== null) {
      return;
    }

    const updateSnapshot = this.updateSnapshot.bind(this);
    const query = this.query;
    const wsUrl = this.wsUrl;

    const program = Effect.gen(function* () {
      let firstAttempt = true;

      while (true) {
        updateSnapshot((current) => ({
          ...current,
          status: firstAttempt ? "connecting" : "reconnecting"
        }));

        let connectedThisAttempt = false;

        const result = yield* Effect.scoped(
          Effect.gen(function* () {
            const client = yield* RpcClient.make(HeartbeatRpcGroup);

            yield* client.SubscribeGroups(query).pipe(
              Stream.runForEach((event) =>
                Effect.sync(() => {
                  connectedThisAttempt = true;

                  updateSnapshot((current) => ({
                    status: "connected",
                    groups: applyGroupEvent(current.groups, event)
                  }));
                })
              )
            );
          }).pipe(Effect.provide(makeRpcClientLayer(wsUrl)))
        ).pipe(Effect.exit);

        firstAttempt = false;

        if (Exit.isFailure(result)) {
          updateSnapshot((current) => ({
            ...current,
            status: connectedThisAttempt ? "reconnecting" : "disconnected"
          }));
        }

        yield* Effect.sleep(RETRY_DELAY);
      }
    });

    this.fiber = Effect.runFork(program);
  }

  private stop() {
    if (this.fiber === null) {
      return;
    }

    const fiber = this.fiber;
    this.fiber = null;
    void Effect.runPromise(Fiber.interrupt(fiber));
  }

  private scheduleDispose() {
    if (this.disposeTimer !== null) {
      return;
    }

    this.disposeTimer = window.setTimeout(() => {
      this.disposeTimer = null;

      if (this.listeners.size > 0) {
        return;
      }

      this.stop();
      heartbeatGroupStores.delete(this.key);
    }, STORE_DISPOSE_GRACE_MS);
  }
}

const heartbeatGroupStores = new Map<string, HeartbeatGroupStore>();

export const getHeartbeatGroupStore = (
  query: HeartbeatGroupQuery,
  wsUrl: string
) => {
  const key = `${wsUrl}::${encodeHeartbeatGroupQueryKey(query)}`;
  const existing = heartbeatGroupStores.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const created = new HeartbeatGroupStore(key, query, wsUrl);
  heartbeatGroupStores.set(key, created);
  return created;
};
