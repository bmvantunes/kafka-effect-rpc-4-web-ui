"use client";

import type { HeartbeatGroupQuery } from "../../../shared/heartbeat-contract";
import { deriveGroupHealthViews, formatAge, formatTimestamp } from "../lib/heartbeat-monitor";
import { useHeartbeatGroups } from "../lib/use-heartbeat-groups";
import { EmptyPanel, HealthPill, Panel } from "./monitor-ui";

interface DimensionCatalogueViewProps {
  readonly query: HeartbeatGroupQuery;
  readonly kicker: string;
  readonly title: string;
  readonly description: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly groupLabel: string;
  readonly childPluralLabel: string;
}

export const DimensionCatalogueView = ({
  query,
  kicker,
  title,
  description,
  emptyTitle,
  emptyBody,
  groupLabel,
  childPluralLabel
}: DimensionCatalogueViewProps) => {
  const subscription = useHeartbeatGroups(query);
  const groups = deriveGroupHealthViews(subscription.groups, subscription.now);
  const groupLabelLower = groupLabel.toLowerCase();

  return (
    <Panel
      kicker={kicker}
      title={title}
      description={description}
    >
      {groups.length === 0 ? (
        <EmptyPanel title={emptyTitle} body={emptyBody} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.key}
              className={`rounded-[1.8rem] border p-6 ${
                group.stale
                  ? "border-rose-400/28 bg-rose-500/8"
                  : "border-emerald-400/28 bg-emerald-500/8"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    {groupLabel}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{group.key}</h2>
                </div>
                <HealthPill
                  label={group.stale ? `stale ${groupLabelLower}` : `healthy ${groupLabelLower}`}
                  tone={group.status}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Healthy {childPluralLabel}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {group.healthyChildren}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Stale {childPluralLabel}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {group.staleChildren}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Process instances
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {group.processInstances}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Oldest heartbeat
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {formatAge(group.oldestTimestamp, subscription.now)}
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {group.children.map((child) => (
                  <li
                    key={`${group.key}:${child.key}`}
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
  );
};
