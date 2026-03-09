"use client";

import { Link } from "@tanstack/react-router";
import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  type HeartbeatGroupQuery
} from "../../../shared/heartbeat-contract";
import {
  deriveGroupHealthViews,
  deriveRegionHealthViews,
  formatAge,
  formatFreshnessWindow,
  formatTimestamp,
  summarizeMonitor
} from "../lib/heartbeat-monitor";
import { useHeartbeatEndpoint } from "../lib/heartbeat-endpoint-context";
import { useHeartbeatGroups } from "../lib/use-heartbeat-groups";
import { ConnectionPill, EmptyPanel, HealthPill, MetricCard, Panel } from "./monitor-ui";

const REGION_SYSTEM_QUERY = {
  groupBy: "region",
  childGroupBy: "system",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

const SYSTEM_APP_QUERY = {
  groupBy: "system",
  childGroupBy: "appName",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

const APP_HOST_QUERY = {
  groupBy: "appName",
  childGroupBy: "hostname",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

export const DashboardView = () => {
  const { wsUrl } = useHeartbeatEndpoint();
  const regionSubscription = useHeartbeatGroups(REGION_SYSTEM_QUERY);
  const systemSubscription = useHeartbeatGroups(SYSTEM_APP_QUERY);
  const appSubscription = useHeartbeatGroups(APP_HOST_QUERY);
  const regionViews = deriveRegionHealthViews(
    regionSubscription.groups,
    regionSubscription.now
  );
  const systemViews = deriveGroupHealthViews(
    systemSubscription.groups,
    systemSubscription.now
  );
  const summary = summarizeMonitor(
    regionSubscription.groups,
    systemSubscription.groups,
    appSubscription.groups,
    regionSubscription.now
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2.2rem] border border-white/12 bg-white/8 p-7 shadow-[0_24px_100px_rgba(3,7,18,0.3)] backdrop-blur-xl md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-cyan-200/70">
            Live Heartbeat Dashboard
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl">
            Query only what the screen needs. Keep the board fast even when the
            backend tracks the full world.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Every process heartbeat now carries region, system, appName,
            hostname and processName. The UI subscribes to grouped views
            instead of the raw process stream.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ConnectionPill status={regionSubscription.status} />
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 font-mono text-xs text-slate-200">
              {wsUrl}
            </span>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-white/12 bg-slate-950/72 p-7 shadow-[0_24px_100px_rgba(3,7,18,0.32)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-amber-200/70">
            Health Rule
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              <span className="font-semibold text-white">Region green</span> only
              when every system, app, host and process heartbeat underneath
              that region is fresh.
            </p>
            <p>
              <span className="font-semibold text-white">System green</span> only
              when every observed app, region, host and process under that
              system is fresh.
            </p>
            <p className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
              Example: if <span className="font-semibold">Gmail</span> has 12
              process heartbeats across regions and one old process drags the minimum
              timestamp down, Gmail turns red globally.
            </p>
            <p className="text-slate-400">
              Freshness window:{" "}
              <span className="font-mono text-slate-200">{formatFreshnessWindow()}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          eyebrow="Regions"
          value={`${summary.healthyRegions}/${summary.regions}`}
          caption={`${summary.staleRegions} stale regions right now`}
        />
        <MetricCard
          eyebrow="Systems"
          value={`${summary.healthySystems}/${summary.systems}`}
          caption={`${summary.staleSystems} stale logical systems`}
        />
        <MetricCard
          eyebrow="Apps"
          value={String(summary.apps)}
          caption="Observed app names across the fleet"
        />
        <MetricCard
          eyebrow="Processes"
          value={String(summary.processInstances)}
          caption="Observed process heartbeats in memory"
        />
        <MetricCard
          eyebrow="Latest heartbeat"
          value={formatAge(summary.lastHeartbeatAt, regionSubscription.now)}
          caption={`Seen at ${formatTimestamp(summary.lastHeartbeatAt)}`}
        />
      </section>

      <Panel
        kicker="Transport View"
        title="Grouped subscriptions only"
        description="This screen opens region->system, system->appName, and appName->hostname queries. It does not ingest the raw process heartbeat firehose."
      >
        <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Dashboard subscriptions</p>
              <p className="mt-1 text-sm text-slate-300">
                The homepage only pulls the grouped datasets it renders.
              </p>
            </div>
            <ConnectionPill status={regionSubscription.status} />
          </div>

          <dl className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <dt>Region groups</dt>
              <dd className="font-mono text-slate-100">{regionViews.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>System groups</dt>
              <dd className="font-mono text-slate-100">{systemViews.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>App groups</dt>
              <dd className="font-mono text-slate-100">{summary.apps}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Process instances</dt>
              <dd className="font-mono text-slate-100">{summary.processInstances}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 md:col-span-2">
              <dt>Freshness window</dt>
              <dd className="font-mono text-slate-100">{formatFreshnessWindow()}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 md:col-span-2">
              <dt>Latest heartbeat</dt>
              <dd className="font-mono text-slate-100">
                {formatAge(summary.lastHeartbeatAt, regionSubscription.now)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 md:col-span-2">
              <dt>Latest heartbeat at</dt>
              <dd className="font-mono text-slate-100">
                {formatTimestamp(summary.lastHeartbeatAt)}
              </dd>
            </div>
          </dl>
        </div>
      </Panel>

      <Panel
        kicker="Regional Board"
        title="All regions at a glance"
        description="Regions are streamed as aggregated groups with their system children, so the homepage never needs the raw per-process feed."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              to="/regions"
              className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12"
            >
              Open regions page
            </Link>
            <Link
              to="/systems"
              className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12"
            >
              Open systems page
            </Link>
            <Link
              to="/appnames"
              className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/12"
            >
              Open app names page
            </Link>
          </div>
        }
      >
        {regionViews.length === 0 ? (
          <EmptyPanel
            title="No grouped region data yet"
            body="Once the consumer ingests process heartbeats, grouped regional views will appear here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {regionViews.map((region) => (
              <article
                key={region.region}
                className={`rounded-[1.7rem] border p-5 ${
                  region.stale
                    ? "border-rose-400/30 bg-rose-500/8"
                    : "border-emerald-400/30 bg-emerald-500/8"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{region.region}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {region.healthySystems}/{region.totalSystems} healthy systems ·{" "}
                      {region.processInstances} process instances
                    </p>
                  </div>
                  <HealthPill
                    label={region.stale ? "stale region" : "healthy region"}
                    tone={region.status}
                  />
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Oldest process heartbeat
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {formatAge(region.minTimestamp, regionSubscription.now)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Newest process heartbeat
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {formatAge(region.newestTimestamp, regionSubscription.now)}
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {region.systems.map((system) => (
                    <li
                      key={`${region.region}:${system.system}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{system.system}</p>
                        <p className="text-sm text-slate-400">
                          {system.count} process instances ·{" "}
                          {formatTimestamp(system.maxTimestamp)}
                        </p>
                      </div>
                      <HealthPill
                        label={system.stale ? "stale" : "healthy"}
                        tone={system.status}
                      />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        kicker="Cross-Region Systems"
        title="Logical system health summary"
        description="Systems are streamed independently as system->appName groups, so the system rollup shows business systems separately from deployable app names."
      >
        {systemViews.length === 0 ? (
          <EmptyPanel
            title="No systems to roll up"
            body="System-level grouped views appear once the consumer has seen at least one process heartbeat."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {systemViews.slice(0, 6).map((system) => (
              <article
                key={system.key}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{system.key}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {system.processInstances} process instances across{" "}
                      {system.totalChildren} app names
                    </p>
                  </div>
                  <HealthPill
                    label={system.stale ? "stale" : "healthy"}
                    tone={system.status}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                  <span>Healthy app names</span>
                  <span className="font-mono text-slate-100">
                    {system.healthyChildren}/{system.totalChildren}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Oldest heartbeat</span>
                  <span className="font-mono text-slate-100">
                    {formatAge(system.oldestTimestamp, systemSubscription.now)}
                  </span>
                </div>

                <ul className="mt-4 space-y-2">
                  {system.children.map((child) => (
                    <li
                      key={`${system.key}:${child.key}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{child.key}</p>
                        <p className="text-sm text-slate-400">
                          {child.count} process instances · {formatTimestamp(child.maxTimestamp)}
                        </p>
                      </div>
                      <HealthPill
                        label={child.stale ? "stale" : "healthy"}
                        tone={child.status}
                      />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};
