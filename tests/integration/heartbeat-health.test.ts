import { createServer as createNetServer } from "node:net";
import { expect, test } from "vitest";
import {
  makeTestKafkaConfig,
  readHealthJson,
  readHeartbeatSnapshot,
  startHeartbeatServer
} from "../helpers/heartbeat-test-utils";

test("health endpoints and websocket snapshot report readiness", async () => {
  const config = await makeTestKafkaConfig();
  const server = await startHeartbeatServer(config);

  try {
    const health = await readHealthJson(server.baseUrl, "/health");
    const ready = await readHealthJson(server.baseUrl, "/ready");
    const snapshot = await readHeartbeatSnapshot(server.wsUrl);

    expect(health.statusCode).toBe(200);
    expect(health.body.ready).toBe(true);
    expect(health.body.status).toBe("ok");
    expect(health.body.topic).toBe(config.topic);
    expect(health.body.connectedClients).toBe(0);

    expect(ready.statusCode).toBe(200);
    expect(ready.body.ready).toBe(true);

    expect(snapshot.type).toBe("snapshot");
    expect(snapshot.regions).toEqual([]);
  } finally {
    await server.stop();
  }
});

test("consumer startup fails fast when the configured server port is already occupied", async () => {
  const portHolder = createNetServer();

  try {
    const port = await new Promise<number>((resolve, reject) => {
      portHolder.once("error", reject);
      portHolder.once("listening", () => {
        const address = portHolder.address();

        if (address === null || typeof address === "string") {
          reject(new Error("failed to bind a test port"));
          return;
        }

        resolve(address.port);
      });

      portHolder.listen(0, "127.0.0.1");
    });

    const config = await makeTestKafkaConfig({
      rpcWsPort: port
    });

    await expect(startHeartbeatServer(config)).rejects.toThrow(
      /consumer process exited before becoming ready|consumer http\/rpc port unavailable|EADDRINUSE|listen EADDRINUSE/
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      portHolder.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
