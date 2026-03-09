import type { ReactNode } from "react";
import type { HealthTone } from "../lib/heartbeat-monitor";
import type { ConnectionStatus } from "../lib/use-heartbeat-groups";

export type StatusTone = HealthTone | "unknown";

const healthToneClassName: Record<HealthTone, string> = {
  healthy: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  stale: "border-rose-400/50 bg-rose-500/15 text-rose-100"
};

const statusToneClassName: Record<StatusTone, string> = {
  ...healthToneClassName,
  unknown: "border-amber-300/40 bg-amber-400/12 text-amber-50"
};

const connectionToneClassName: Record<ConnectionStatus, string> = {
  connecting: "border-amber-400/50 bg-amber-500/15 text-amber-100",
  connected: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  reconnecting: "border-sky-400/50 bg-sky-500/15 text-sky-100",
  disconnected: "border-rose-400/50 bg-rose-500/15 text-rose-100"
};

export const HealthPill = ({
  label,
  tone
}: {
  readonly label: string;
  readonly tone: HealthTone;
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${healthToneClassName[tone]}`}
  >
    {label}
  </span>
);

export const StatusPill = ({
  label,
  tone
}: {
  readonly label: string;
  readonly tone: StatusTone;
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusToneClassName[tone]}`}
  >
    {label}
  </span>
);

export const ConnectionPill = ({
  status
}: {
  readonly status: ConnectionStatus;
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${connectionToneClassName[status]}`}
  >
    {status}
  </span>
);

export const MetricCard = ({
  eyebrow,
  value,
  caption
}: {
  readonly eyebrow: string;
  readonly value: string;
  readonly caption: string;
}) => (
  <article className="rounded-[1.6rem] border border-white/12 bg-white/6 p-5 shadow-[0_24px_80px_rgba(4,8,20,0.22)] backdrop-blur">
    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
      {eyebrow}
    </p>
    <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    <p className="mt-2 text-sm text-slate-300">{caption}</p>
  </article>
);

export const Panel = ({
  kicker,
  title,
  description,
  actions,
  children
}: {
  readonly kicker: string;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) => (
  <section className="rounded-[2rem] border border-white/12 bg-slate-950/72 p-6 shadow-[0_24px_100px_rgba(3,7,18,0.32)] backdrop-blur-xl md:p-7">
    <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-cyan-200/70">
          {kicker}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {actions}
    </header>
    <div className="mt-6">{children}</div>
  </section>
);

export const EmptyPanel = ({
  title,
  body
}: {
  readonly title: string;
  readonly body: string;
}) => (
  <div className="rounded-[1.6rem] border border-dashed border-white/16 bg-white/4 px-6 py-10 text-center">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm text-slate-300">{body}</p>
  </div>
);
