import type { HeartbeatIdentity } from "../lib/heartbeat-rpc";
import type { StorybookScenarioDefinition } from "../lib/storybook-scenario";

const REGIONS = ["USA", "Europe", "Asia"] as const;
const SYSTEM_APPS = {
  Gmail: ["gmail-api", "gmail-worker"],
  Drive: ["drive-api", "drive-worker"],
  Calendar: ["calendar-api", "calendar-worker"]
} as const;
const HOSTS = ["host-1", "host-2"] as const;
const PROCESSES = ["process-stuff", "process-another-stuff"] as const;

type IdentityMatch = Partial<HeartbeatIdentity>;

const matchesIdentity = (
  identity: HeartbeatIdentity,
  match: IdentityMatch | undefined
) =>
  match !== undefined &&
  (match.region === undefined || match.region === identity.region) &&
  (match.system === undefined || match.system === identity.system) &&
  (match.appName === undefined || match.appName === identity.appName) &&
  (match.hostname === undefined || match.hostname === identity.hostname) &&
  (match.processName === undefined || match.processName === identity.processName);

const buildFleetScenario = ({
  title,
  defaultAgeMs,
  overrides = []
}: {
  readonly title: string;
  readonly defaultAgeMs: number;
  readonly overrides?: ReadonlyArray<{
    readonly match: IdentityMatch;
    readonly ageMs: number;
  }>;
}): StorybookScenarioDefinition => ({
  title,
  steps: REGIONS.flatMap((region) =>
    Object.entries(SYSTEM_APPS).flatMap(([system, apps]) =>
      HOSTS.flatMap((host) =>
        apps.flatMap((appName) =>
          PROCESSES.map((processName) => {
            const hostname = `${system.toLowerCase()}-${region.toLowerCase()}-${host}`;
            const identity = {
              region,
              system,
              appName,
              hostname,
              processName
            } satisfies HeartbeatIdentity;
            const override = overrides.find((candidate) =>
              matchesIdentity(identity, candidate.match)
            );

            return {
              ...identity,
              ageMs: override?.ageMs ?? defaultAgeMs
            };
          })
        )
      )
    )
  )
});

export const dashboardHealthyScenario = buildFleetScenario({
  title: "healthy-fleet",
  defaultAgeMs: 1_500
});

export const gmailDegradedScenario = buildFleetScenario({
  title: "gmail-degraded",
  defaultAgeMs: 1_500,
  overrides: [
    {
      match: {
        region: "Europe",
        system: "Gmail",
        appName: "gmail-worker",
        hostname: "gmail-europe-host-2",
        processName: "process-another-stuff"
      },
      ageMs: 28_000
    }
  ]
});

export const hostRecoveryScenario = buildFleetScenario({
  title: "host-recovery-mix",
  defaultAgeMs: 1_200,
  overrides: [
    {
      match: {
        hostname: "drive-asia-host-2"
      },
      ageMs: 22_000
    },
    {
      match: {
        hostname: "calendar-usa-host-1"
      },
      ageMs: 16_000
    }
  ]
});
