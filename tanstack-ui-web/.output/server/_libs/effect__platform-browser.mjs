import { e as effect, m as makeWebSocket, S as Socket, p as provide, l as layerWebSocketConstructorGlobal } from "./effect.mjs";
const layerWebSocket = (url, options) => effect(Socket, makeWebSocket(url, options)).pipe(provide(layerWebSocketConstructor));
const layerWebSocketConstructor = layerWebSocketConstructorGlobal;
export {
  layerWebSocket as l
};
