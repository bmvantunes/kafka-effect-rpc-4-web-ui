"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatAge } from "../lib/heartbeat-monitor";
import { useHeartbeatEndpoint } from "../lib/heartbeat-endpoint-context";
import { useSystemBadge } from "../lib/use-heartbeat-groups";
import { ConnectionPill, StatusPill } from "./monitor-ui";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/regions", label: "Regions" },
  { href: "/systems", label: "Systems" },
  { href: "/appnames", label: "App Names" },
  { href: "/hostnames", label: "Hostnames" },
  { href: "/process-names", label: "Process Names" }
] as const;

export const MonitorShell = ({
  children
}: {
  readonly children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const { wsUrl } = useHeartbeatEndpoint();
  const gmailBadge = useSystemBadge("Gmail");
  const gmailLabel =
    gmailBadge.tone === "healthy"
      ? "Gmail healthy"
      : gmailBadge.tone === "stale"
        ? "Gmail stale"
        : "Gmail waiting";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_24%),radial-gradient(circle_at_right,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#08111f_0%,_#060b16_42%,_#050910_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_18%),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.18),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.12),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 mb-8 rounded-[2rem] border border-white/12 bg-slate-950/78 px-5 py-4 shadow-[0_26px_90px_rgba(3,7,18,0.36)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3 text-lg font-semibold tracking-[0.08em] text-white"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/12 text-sm font-bold uppercase text-emerald-100">
                  PM
                </span>
                Pulse Monitor
              </Link>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Live heartbeat supervision for cross-region systems. Regions
                stay green only while every observed system, app, host and
                process inside them is fresh. Systems stay green only while
                every observed app, region, host and process under them is
                fresh.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-sm text-slate-300">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <ConnectionPill status={gmailBadge.status} />
                <StatusPill label={gmailLabel} tone={gmailBadge.tone} />
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 font-mono text-[11px] text-slate-200">
                  {wsUrl}
                </span>
              </div>
              <p className="text-right text-xs uppercase tracking-[0.28em] text-slate-400">
                trader badge source {gmailBadge.system} {formatAge(gmailBadge.minTimestamp)}
              </p>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-3">
            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.18)]"
                      : "border border-white/12 bg-white/6 text-slate-200 hover:border-cyan-200/40 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
