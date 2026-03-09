"use client";

import { createContext, useContext } from "react";
import {
  deriveHeartbeatHttpBaseUrl,
  HEARTBEAT_HTTP_BASE_URL,
  HEARTBEAT_WS_URL
} from "./monitor-config";

interface HeartbeatEndpointContextValue {
  readonly wsUrl: string;
  readonly httpBaseUrl: string;
}

const defaultValue: HeartbeatEndpointContextValue = {
  wsUrl: HEARTBEAT_WS_URL,
  httpBaseUrl: HEARTBEAT_HTTP_BASE_URL
};

const HeartbeatEndpointContext =
  createContext<HeartbeatEndpointContextValue>(defaultValue);

export const HeartbeatEndpointProvider = ({
  children,
  wsUrl,
  httpBaseUrl
}: {
  readonly children: React.ReactNode;
  readonly wsUrl: string;
  readonly httpBaseUrl?: string;
}) => (
  <HeartbeatEndpointContext.Provider
    value={{
      wsUrl,
      httpBaseUrl: httpBaseUrl ?? deriveHeartbeatHttpBaseUrl(wsUrl)
    }}
  >
    {children}
  </HeartbeatEndpointContext.Provider>
);

export const useHeartbeatEndpoint = () => useContext(HeartbeatEndpointContext);
