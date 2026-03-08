import { Effect } from "effect";
import * as Fiber from "effect/Fiber";
import { expect, test } from "vitest";
import {
  hasStatusSubsequence,
  makeNodeHeartbeatStore,
  makeTestKafkaConfig,
  produceHeartbeat,
  startHeartbeatServer,
  waitFor
} from "../helpers/heartbeat-test-utils";

test("isolated heartbeat client store reports reconnect and recovery against real Kafka", async () => {
  const config = await makeTestKafkaConfig();
  let activeServer = await startHeartbeatServer(config);

  const store = makeNodeHeartbeatStore(activeServer.wsUrl);
  const clientFiber = store.start();
  const observedStatuses: Array<string> = [];
  const unsubscribe = store.registry.subscribe(
    store.connectionStatusAtom,
    (status) => {
      observedStatuses.push(status);
    },
    { immediate: true }
  );

  try {
    await waitFor("client connecting then connected", () =>
      hasStatusSubsequence(observedStatuses, ["connecting", "connected"])
        ? observedStatuses
        : undefined
    );

    await produceHeartbeat(config, {
      region: "Asia",
      system: "system-one"
    });

    await waitFor("client store to receive the first region", () => {
      const regions = store.registry.get(store.regionsViewAtom);
      return regions.length > 0 ? regions : undefined;
    });

    await activeServer.stop();

    await waitFor("client reconnect sequence after server stop", () =>
      hasStatusSubsequence(
        observedStatuses,
        ["connecting", "connected", "reconnecting", "disconnected"]
      )
        ? observedStatuses
        : undefined
    );

    activeServer = await startHeartbeatServer(config);

    await produceHeartbeat(config, {
      region: "Asia",
      system: "system-two"
    });

    await waitFor("client recovers to connected after restart", () =>
      hasStatusSubsequence(
        observedStatuses,
        ["connecting", "connected", "reconnecting", "disconnected", "connected"]
      )
        ? observedStatuses
        : undefined
    );

    const regions = await waitFor("client store to receive post-restart data", () => {
      const currentRegions = store.registry.get(store.regionsViewAtom);
      const hasSystem = currentRegions.some((region) =>
        region.systems.some((system) => system.system === "system-two")
      );

      return hasSystem ? currentRegions : undefined;
    });

    expect(
      regions.some((region) =>
        region.systems.some((system) => system.system === "system-two")
      )
    ).toBe(true);
  } finally {
    unsubscribe();
    await Effect.runPromise(Fiber.interrupt(clientFiber));
    await activeServer.stop();
  }
});
