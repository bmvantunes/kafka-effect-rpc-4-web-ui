"use client";

import {
  EMPTY_HEARTBEAT_GROUP_FILTERS,
  type HeartbeatGroupQuery
} from "../../../shared/heartbeat-contract";
import { deriveRegionHealthViews, formatAge, formatTimestamp } from "../lib/heartbeat-monitor";
import { useHeartbeatGroups } from "../lib/use-heartbeat-groups";
import { EmptyPanel, HealthPill, Panel } from "./monitor-ui";

const REGIONS_QUERY = {
  groupBy: "region",
  childGroupBy: "system",
  filters: EMPTY_HEARTBEAT_GROUP_FILTERS
} satisfies HeartbeatGroupQuery;

export const RegionsView = () => {
  const subscription = useHeartbeatGroups(REGIONS_QUERY);
  const regionViews = deriveRegionHealthViews(subscription.groups, subscription.now);

  return (
    <Panel
      kicker="Regions"
      title="Regional health catalogue"
      description="A region is green only when every observed system, app, host and process underneath it is fresh. The UI receives region->system grouped views, not the raw process feed."
    >
      {regionViews.length === 0 ? (
        <EmptyPanel
          title="No regions yet"
          body="As soon as grouped region data arrives, regions will appear here with freshness and process instance counts."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {regionViews.map((region) => (
            <article
              key={region.region}
              className={`rounded-[1.8rem] border p-6 ${
                region.stale
                  ? "border-rose-400/28 bg-rose-500/8"
                  : "border-emerald-400/28 bg-emerald-500/8"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    Region
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{region.region}</h2>
                </div>
                <HealthPill
                  label={region.stale ? "stale region" : "healthy region"}
                  tone={region.status}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Healthy systems
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {region.healthySystems}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Stale systems
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {region.staleSystems}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Process instances
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {region.processInstances}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Oldest heartbeat
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {formatAge(region.minTimestamp, subscription.now)}
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
                        {system.count} process instances · {formatTimestamp(system.maxTimestamp)}
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
  );
};
