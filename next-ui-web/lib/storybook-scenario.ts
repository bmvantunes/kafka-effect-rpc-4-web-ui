import type { HeartbeatIdentity } from "./heartbeat-rpc";

export const STORYBOOK_CONTROLLER_PORT = 6011;
const CONTROLLER_IDLE_HOST = "127.0.0.1";

export interface StorybookUpsertStep extends HeartbeatIdentity {
  readonly kind?: "upsert";
  readonly ageMs?: number;
}

export interface StorybookTombstoneStep extends HeartbeatIdentity {
  readonly kind: "tombstone";
}

export type StorybookScenarioStep =
  | StorybookUpsertStep
  | StorybookTombstoneStep;

export interface StorybookScenarioDefinition {
  readonly title: string;
  readonly steps: ReadonlyArray<StorybookScenarioStep>;
}

export interface StorybookScenarioStartRequest {
  readonly storyId: string;
  readonly scenarioKey: string;
  readonly scenario: StorybookScenarioDefinition;
}

export interface StorybookScenarioStartResponse {
  readonly scenarioId: string;
  readonly wsUrl: string;
  readonly httpBaseUrl: string;
  readonly topic: string;
}

export interface StorybookScenarioTouchRequest {
  readonly scenarioId: string;
}

export interface StorybookScenarioStopRequest {
  readonly scenarioId: string;
}

export const getStorybookControllerUrl = () => {
  if (typeof window === "undefined") {
    return `http://${CONTROLLER_IDLE_HOST}:${STORYBOOK_CONTROLLER_PORT}`;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${window.location.hostname}:${STORYBOOK_CONTROLLER_PORT}`;
};
