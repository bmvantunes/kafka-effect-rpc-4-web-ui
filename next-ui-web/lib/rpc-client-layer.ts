import * as BrowserSocket from "@effect/platform-browser/BrowserSocket";
import * as Layer from "effect/Layer";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { HEARTBEAT_WS_URL } from "./monitor-config";

const rpcClientLayers = new Map<
  string,
  Layer.Layer<RpcClient.Protocol, never, never>
>();

export const makeRpcClientLayer = (wsUrl: string) => {
  const existing = rpcClientLayers.get(wsUrl);

  if (existing !== undefined) {
    return existing;
  }

  const created = RpcClient.layerProtocolSocket().pipe(
    Layer.provideMerge(BrowserSocket.layerWebSocket(wsUrl)),
    Layer.provideMerge(RpcSerialization.layerJson)
  );

  rpcClientLayers.set(wsUrl, created);
  return created;
};

export const rpcClientLayer = makeRpcClientLayer(HEARTBEAT_WS_URL);
