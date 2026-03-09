export const DEFAULT_HEARTBEAT_WS_URL = "ws://127.0.0.1:3001/ws";

const viteEnv =
  typeof import.meta !== "undefined" ? import.meta.env : undefined;

export const HEARTBEAT_WS_URL =
  viteEnv?.VITE_HEARTBEAT_WS_URL ?? DEFAULT_HEARTBEAT_WS_URL;

export const deriveHeartbeatHttpBaseUrl = (wsUrl: string) => {
  const url = new URL(wsUrl);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.origin;
};

export const HEARTBEAT_HTTP_BASE_URL =
  viteEnv?.VITE_HEARTBEAT_HTTP_URL ?? deriveHeartbeatHttpBaseUrl(HEARTBEAT_WS_URL);
