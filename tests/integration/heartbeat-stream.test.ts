import { expect, test } from "vitest";
import {
  collectSnapshotThenUpdate,
  makeTestKafkaConfig,
  produceHeartbeat,
  readHealthJson,
  startHeartbeatServer,
  waitFor
} from "../helpers/heartbeat-test-utils";

test("RPC stream sends a full snapshot first and then live updates only", async () => {
  const config = await makeTestKafkaConfig();
  const server = await startHeartbeatServer(config);

  try {
    const initialHeartbeat = await produceHeartbeat(config, {
      region: "Europe",
      system: "system-alpha"
    });

    await waitFor("consumer to publish first heartbeat into the snapshot", async () => {
      const { body } = await readHealthJson(server.baseUrl);
      return body.systems >= 1 ? body : undefined;
    });

    const nextHeartbeat = {
      region: "Europe",
      system: "system-beta",
      timestamp: Date.now() + 1_000
    };

    const [first, second] = await collectSnapshotThenUpdate(server.wsUrl, async () => {
      await produceHeartbeat(config, nextHeartbeat);
    });

    expect(first.type).toBe("snapshot");
    if (first.type !== "snapshot") {
      throw new Error(`expected snapshot, received ${first.type}`);
    }

    expect(first.regions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          region: initialHeartbeat.region,
          systems: expect.arrayContaining([
            expect.objectContaining({
              system: initialHeartbeat.system,
              timestamp: initialHeartbeat.timestamp
            })
          ])
        })
      ])
    );

    expect(second.type).toBe("update");
    if (second.type !== "update") {
      throw new Error(`expected update, received ${second.type}`);
    }

    expect(second.region).toBe(nextHeartbeat.region);
    expect(second.system).toBe(nextHeartbeat.system);
    expect(second.timestamp).toBe(nextHeartbeat.timestamp);
  } finally {
    await server.stop();
  }
});
