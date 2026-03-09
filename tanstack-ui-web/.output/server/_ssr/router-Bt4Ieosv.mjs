import { c as createRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, O as Outlet, H as HeadContent, S as Scripts, u as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { U as Union, L as Literal, a as Struct, N as NullOr, A as Array, b as String, c as Number$1, d as make, f as make$1, g as layerProtocolSocket, h as provideMerge, i as layerJson, j as gen, s as scoped, k as make$2, r as runForEach, n as sync, o as provide, q as exit, t as isFailure, u as sleep, v as runFork, w as runPromise, x as interrupt, B as Boolean } from "../_libs/effect.mjs";
import { l as layerWebSocket } from "../_libs/effect__platform-browser.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const HeartbeatGroupDimensionSchema = Union([
  Literal("region"),
  Literal("system"),
  Literal("appName"),
  Literal("hostname"),
  Literal("processName")
]);
Struct({
  region: String,
  system: String,
  appName: String,
  hostname: String,
  processName: String
});
Struct({
  timestamp: Number$1,
  region: String,
  system: String,
  appName: String,
  hostname: String,
  processName: String
});
const HEARTBEAT_STALE_AFTER_MS = 1e4;
const HEARTBEAT_QUERY_KEY_VERSION = "heartbeat-query.v1";
const encodeKeyPart = (name, value) => `${name}=${encodeURIComponent(value)}`;
const normalizeFilterValues = (values) => {
  if (values === null || values.length === 0) {
    return null;
  }
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};
const isHeartbeatHealthy = (timestamp, now = Date.now()) => Number.isFinite(timestamp) && now - timestamp <= HEARTBEAT_STALE_AFTER_MS;
const HeartbeatGroupFiltersSchema = Struct({
  region: NullOr(Array(String)),
  system: NullOr(Array(String)),
  appName: NullOr(Array(String)),
  hostname: NullOr(Array(String)),
  processName: NullOr(Array(String))
});
const EMPTY_HEARTBEAT_GROUP_FILTERS = {
  region: null,
  system: null,
  appName: null,
  hostname: null,
  processName: null
};
const HeartbeatGroupQuerySchema = Struct({
  groupBy: HeartbeatGroupDimensionSchema,
  filters: HeartbeatGroupFiltersSchema,
  childGroupBy: NullOr(HeartbeatGroupDimensionSchema)
});
const encodeHeartbeatGroupQueryKey = (query) => [
  HEARTBEAT_QUERY_KEY_VERSION,
  encodeKeyPart("groupBy", query.groupBy),
  encodeKeyPart("childGroupBy", query.childGroupBy ?? "*"),
  encodeKeyPart(
    "region",
    normalizeFilterValues(query.filters.region)?.join(",") ?? "*"
  ),
  encodeKeyPart(
    "system",
    normalizeFilterValues(query.filters.system)?.join(",") ?? "*"
  ),
  encodeKeyPart(
    "appName",
    normalizeFilterValues(query.filters.appName)?.join(",") ?? "*"
  ),
  encodeKeyPart(
    "hostname",
    normalizeFilterValues(query.filters.hostname)?.join(",") ?? "*"
  ),
  encodeKeyPart(
    "processName",
    normalizeFilterValues(query.filters.processName)?.join(",") ?? "*"
  )
].join("|");
const HeartbeatGroupChildSchema = Struct({
  key: String,
  minTimestamp: Number$1,
  maxTimestamp: Number$1,
  count: Number$1
});
const HeartbeatGroupSchema = Struct({
  key: String,
  minTimestamp: Number$1,
  maxTimestamp: Number$1,
  count: Number$1,
  children: Array(HeartbeatGroupChildSchema)
});
const HeartbeatGroupSnapshotEventSchema = Struct({
  type: Literal("snapshot"),
  emittedAt: Number$1,
  groups: Array(HeartbeatGroupSchema)
});
const HeartbeatGroupUpsertEventSchema = Struct({
  type: Literal("upsert"),
  emittedAt: Number$1,
  group: HeartbeatGroupSchema
});
const HeartbeatGroupDeleteEventSchema = Struct({
  type: Literal("delete"),
  emittedAt: Number$1,
  key: String
});
const HeartbeatGroupEventSchema = Union([
  HeartbeatGroupSnapshotEventSchema,
  HeartbeatGroupUpsertEventSchema,
  HeartbeatGroupDeleteEventSchema
]);
Struct({
  status: String,
  ready: Boolean,
  consumerState: String,
  topic: String,
  wsPort: Number$1,
  wsPath: String,
  activeSubscriptions: Number$1,
  regions: Number$1,
  healthyRegions: Number$1,
  staleRegions: Number$1,
  systems: Number$1,
  healthySystems: Number$1,
  staleSystems: Number$1,
  apps: Number$1,
  healthyApps: Number$1,
  staleApps: Number$1,
  hostInstances: Number$1,
  processInstances: Number$1,
  staleAfterMs: Number$1,
  lastHeartbeatAt: NullOr(Number$1)
});
const SubscribeGroupsRpc = make("SubscribeGroups", {
  payload: HeartbeatGroupQuerySchema,
  success: HeartbeatGroupEventSchema,
  stream: true
});
const HeartbeatRpcGroup = make$1(SubscribeGroupsRpc);
const isFreshTimestamp = (timestamp, now = Date.now()) => isHeartbeatHealthy(timestamp, now);
const formatTimestamp = (timestamp) => timestamp === null || !Number.isFinite(timestamp) ? "n/a" : new Date(timestamp).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});
const formatAge = (timestamp, now = Date.now()) => {
  if (timestamp === null || !Number.isFinite(timestamp)) {
    return "n/a";
  }
  const ageMs = Math.max(0, now - timestamp);
  if (ageMs < 1e3) {
    return "just now";
  }
  const seconds = Math.floor(ageMs / 1e3);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s ago`;
};
const deriveRegionHealthViews = (regions, now = Date.now()) => regions.map((region) => {
  const systems = region.children.map((system) => {
    const stale2 = !isFreshTimestamp(system.minTimestamp, now);
    return {
      system: system.key,
      minTimestamp: system.minTimestamp,
      maxTimestamp: system.maxTimestamp,
      count: system.count,
      ageMs: Math.max(0, now - system.minTimestamp),
      stale: stale2,
      status: stale2 ? "stale" : "healthy"
    };
  }).sort((left, right) => left.system.localeCompare(right.system));
  const healthySystems = systems.filter((system) => !system.stale).length;
  const stale = !isFreshTimestamp(region.minTimestamp, now);
  return {
    region: region.key,
    minTimestamp: region.minTimestamp,
    newestTimestamp: region.maxTimestamp,
    totalSystems: systems.length,
    healthySystems,
    staleSystems: systems.length - healthySystems,
    processInstances: region.count,
    stale,
    status: stale ? "stale" : "healthy",
    systems
  };
}).sort((left, right) => left.region.localeCompare(right.region));
const deriveGroupHealthViews = (groups, now = Date.now()) => groups.map((group) => {
  const children = group.children.map((child) => {
    const stale2 = !isFreshTimestamp(child.minTimestamp, now);
    return {
      key: child.key,
      minTimestamp: child.minTimestamp,
      maxTimestamp: child.maxTimestamp,
      count: child.count,
      ageMs: Math.max(0, now - child.minTimestamp),
      stale: stale2,
      status: stale2 ? "stale" : "healthy"
    };
  }).sort((left, right) => left.key.localeCompare(right.key));
  const healthyChildren = children.filter((child) => !child.stale).length;
  const stale = !isFreshTimestamp(group.minTimestamp, now);
  return {
    key: group.key,
    oldestTimestamp: group.minTimestamp,
    newestTimestamp: group.maxTimestamp,
    totalChildren: children.length,
    healthyChildren,
    staleChildren: children.length - healthyChildren,
    processInstances: group.count,
    stale,
    status: stale ? "stale" : "healthy",
    children
  };
}).sort((left, right) => left.key.localeCompare(right.key));
const summarizeMonitor = (regions, systems, apps, now = Date.now()) => {
  const regionViews = deriveRegionHealthViews(regions, now);
  const systemViews = deriveGroupHealthViews(systems, now);
  const appViews = deriveGroupHealthViews(apps, now);
  const lastHeartbeatAt = regions.length === 0 ? null : Math.max(...regions.map((region) => region.maxTimestamp));
  return {
    regions: regionViews.length,
    healthyRegions: regionViews.filter((region) => !region.stale).length,
    staleRegions: regionViews.filter((region) => region.stale).length,
    systems: systemViews.length,
    healthySystems: systemViews.filter((system) => !system.stale).length,
    staleSystems: systemViews.filter((system) => system.stale).length,
    apps: appViews.length,
    processInstances: regionViews.reduce(
      (count, region) => count + region.processInstances,
      0
    ),
    lastHeartbeatAt
  };
};
const formatFreshnessWindow = () => `${Math.round(HEARTBEAT_STALE_AFTER_MS / 1e3)}s`;
const __vite_import_meta_env__ = {};
const DEFAULT_HEARTBEAT_WS_URL = "ws://127.0.0.1:3001/ws";
const viteEnv = typeof import.meta !== "undefined" ? __vite_import_meta_env__ : void 0;
const HEARTBEAT_WS_URL = viteEnv?.VITE_HEARTBEAT_WS_URL ?? DEFAULT_HEARTBEAT_WS_URL;
const deriveHeartbeatHttpBaseUrl = (wsUrl) => {
  const url = new URL(wsUrl);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.origin;
};
const HEARTBEAT_HTTP_BASE_URL = viteEnv?.VITE_HEARTBEAT_HTTP_URL ?? deriveHeartbeatHttpBaseUrl(HEARTBEAT_WS_URL);
const defaultValue = {
  wsUrl: HEARTBEAT_WS_URL,
  httpBaseUrl: HEARTBEAT_HTTP_BASE_URL
};
const HeartbeatEndpointContext = reactExports.createContext(defaultValue);
const useHeartbeatEndpoint = () => reactExports.useContext(HeartbeatEndpointContext);
const rpcClientLayers = /* @__PURE__ */ new Map();
const makeRpcClientLayer = (wsUrl) => {
  const existing = rpcClientLayers.get(wsUrl);
  if (existing !== void 0) {
    return existing;
  }
  const created = layerProtocolSocket().pipe(
    provideMerge(layerWebSocket(wsUrl)),
    provideMerge(layerJson)
  );
  rpcClientLayers.set(wsUrl, created);
  return created;
};
makeRpcClientLayer(HEARTBEAT_WS_URL);
const RETRY_DELAY = "750 millis";
const STORE_DISPOSE_GRACE_MS = 5e3;
const sortGroups = (groups) => [...groups].sort((left, right) => left.key.localeCompare(right.key));
const applyGroupEvent = (currentGroups, event) => {
  if (event.type === "snapshot") {
    return sortGroups(event.groups);
  }
  if (event.type === "delete") {
    return currentGroups.filter((group) => group.key !== event.key);
  }
  return sortGroups([
    ...currentGroups.filter((group) => group.key !== event.group.key),
    event.group
  ]);
};
class HeartbeatGroupStore {
  constructor(key, query, wsUrl) {
    this.key = key;
    this.query = query;
    this.wsUrl = wsUrl;
  }
  snapshot = {
    status: "connecting",
    groups: []
  };
  listeners = /* @__PURE__ */ new Set();
  fiber = null;
  disposeTimer = null;
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    if (this.disposeTimer !== null) {
      window.clearTimeout(this.disposeTimer);
      this.disposeTimer = null;
    }
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.scheduleDispose();
      }
    };
  };
  publish() {
    for (const listener of this.listeners) {
      listener();
    }
  }
  setSnapshot(next) {
    if (this.snapshot.status === next.status && this.snapshot.groups === next.groups) {
      return;
    }
    this.snapshot = next;
    this.publish();
  }
  updateSnapshot(updater) {
    this.setSnapshot(updater(this.snapshot));
  }
  start() {
    if (this.fiber !== null) {
      return;
    }
    const updateSnapshot = this.updateSnapshot.bind(this);
    const query = this.query;
    const wsUrl = this.wsUrl;
    const program = gen(function* () {
      let firstAttempt = true;
      while (true) {
        updateSnapshot((current) => ({
          ...current,
          status: firstAttempt ? "connecting" : "reconnecting"
        }));
        let connectedThisAttempt = false;
        const result = yield* scoped(
          gen(function* () {
            const client = yield* make$2(HeartbeatRpcGroup);
            yield* client.SubscribeGroups(query).pipe(
              runForEach(
                (event) => sync(() => {
                  connectedThisAttempt = true;
                  updateSnapshot((current) => ({
                    status: "connected",
                    groups: applyGroupEvent(current.groups, event)
                  }));
                })
              )
            );
          }).pipe(provide(makeRpcClientLayer(wsUrl)))
        ).pipe(exit);
        firstAttempt = false;
        if (isFailure(result)) {
          updateSnapshot((current) => ({
            ...current,
            status: connectedThisAttempt ? "reconnecting" : "disconnected"
          }));
        }
        yield* sleep(RETRY_DELAY);
      }
    });
    this.fiber = runFork(program);
  }
  stop() {
    if (this.fiber === null) {
      return;
    }
    const fiber = this.fiber;
    this.fiber = null;
    void runPromise(interrupt(fiber));
  }
  scheduleDispose() {
    if (this.disposeTimer !== null) {
      return;
    }
    this.disposeTimer = window.setTimeout(() => {
      this.disposeTimer = null;
      if (this.listeners.size > 0) {
        return;
      }
      this.stop();
      heartbeatGroupStores.delete(this.key);
    }, STORE_DISPOSE_GRACE_MS);
  }
}
const heartbeatGroupStores = /* @__PURE__ */ new Map();
const getHeartbeatGroupStore = (query, wsUrl) => {
  const key = `${wsUrl}::${encodeHeartbeatGroupQueryKey(query)}`;
  const existing = heartbeatGroupStores.get(key);
  if (existing !== void 0) {
    return existing;
  }
  const created = new HeartbeatGroupStore(key, query, wsUrl);
  heartbeatGroupStores.set(key, created);
  return created;
};
class TickStore {
  now = Date.now();
  listeners = /* @__PURE__ */ new Set();
  timer = null;
  getSnapshot = () => this.now;
  subscribe = (listener) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.timer = window.setInterval(() => {
        this.now = Date.now();
        for (const currentListener of this.listeners) {
          currentListener();
        }
      }, 1e3);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer !== null) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    };
  };
}
const tickStore = new TickStore();
const useTick = () => reactExports.useSyncExternalStore(
  tickStore.subscribe,
  tickStore.getSnapshot,
  tickStore.getSnapshot
);
const useHeartbeatGroups = (query) => {
  const { wsUrl } = useHeartbeatEndpoint();
  const store = getHeartbeatGroupStore(query, wsUrl);
  const snapshot = reactExports.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const now = useTick();
  return {
    status: snapshot.status,
    groups: snapshot.groups,
    now
  };
};
const useSystemBadge = (system) => {
  const { groups, now, status } = useHeartbeatGroups({
    groupBy: "system",
    childGroupBy: null,
    filters: {
      ...EMPTY_HEARTBEAT_GROUP_FILTERS,
      system: [system]
    }
  });
  const group = groups.find((candidate) => candidate.key === system) ?? null;
  const minTimestamp = group?.minTimestamp ?? null;
  const stale = minTimestamp === null ? false : now - minTimestamp > HEARTBEAT_STALE_AFTER_MS;
  const tone = minTimestamp === null || status === "connecting" ? "unknown" : stale || status === "disconnected" ? "stale" : "healthy";
  return {
    status,
    system,
    minTimestamp,
    stale,
    tone
  };
};
const healthToneClassName = {
  healthy: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  stale: "border-rose-400/50 bg-rose-500/15 text-rose-100"
};
const statusToneClassName = {
  ...healthToneClassName,
  unknown: "border-amber-300/40 bg-amber-400/12 text-amber-50"
};
const connectionToneClassName = {
  connecting: "border-amber-400/50 bg-amber-500/15 text-amber-100",
  connected: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  reconnecting: "border-sky-400/50 bg-sky-500/15 text-sky-100",
  disconnected: "border-rose-400/50 bg-rose-500/15 text-rose-100"
};
const HealthPill = ({
  label,
  tone
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "span",
  {
    className: `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${healthToneClassName[tone]}`,
    children: label
  }
);
const StatusPill = ({
  label,
  tone
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "span",
  {
    className: `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusToneClassName[tone]}`,
    children: label
  }
);
const ConnectionPill = ({
  status
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "span",
  {
    className: `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${connectionToneClassName[status]}`,
    children: status
  }
);
const MetricCard = ({
  eyebrow,
  value,
  caption
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "rounded-[1.6rem] border border-white/12 bg-white/6 p-5 shadow-[0_24px_80px_rgba(4,8,20,0.22)] backdrop-blur", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400", children: eyebrow }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-3xl font-semibold text-white", children: value }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-300", children: caption })
] });
const Panel = ({
  kicker,
  title,
  description,
  actions,
  children
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-[2rem] border border-white/12 bg-slate-950/72 p-6 shadow-[0_24px_100px_rgba(3,7,18,0.32)] backdrop-blur-xl md:p-7", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.36em] text-cyan-200/70", children: kicker }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 text-2xl font-semibold text-white", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-6 text-slate-300", children: description })
    ] }),
    actions
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children })
] });
const EmptyPanel = ({
  title,
  body
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[1.6rem] border border-dashed border-white/16 bg-white/4 px-6 py-10 text-center", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-white", children: title }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-300", children: body })
] });
const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/regions", label: "Regions" },
  { href: "/systems", label: "Systems" },
  { href: "/appnames", label: "App Names" },
  { href: "/hostnames", label: "Hostnames" },
  { href: "/process-names", label: "Process Names" }
];
const MonitorShell = ({
  children
}) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const { wsUrl } = useHeartbeatEndpoint();
  const gmailBadge = useSystemBadge("Gmail");
  const gmailLabel = gmailBadge.tone === "healthy" ? "Gmail healthy" : gmailBadge.tone === "stale" ? "Gmail stale" : "Gmail waiting";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_24%),radial-gradient(circle_at_right,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#08111f_0%,_#060b16_42%,_#050910_100%)] text-slate-100", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)] opacity-40" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_18%),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.18),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.12),transparent_24%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-4 z-20 mb-8 rounded-[2rem] border border-white/12 bg-slate-950/78 px-5 py-4 shadow-[0_26px_90px_rgba(3,7,18,0.36)] backdrop-blur-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: "/",
                className: "inline-flex items-center gap-3 text-lg font-semibold tracking-[0.08em] text-white",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/12 text-sm font-bold uppercase text-emerald-100", children: "PM" }),
                  "Pulse Monitor"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-300", children: "Live heartbeat supervision for cross-region systems. Regions stay green only while every observed system, app, host and process inside them is fresh. Systems stay green only while every observed app, region, host and process under them is fresh." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 text-sm text-slate-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectionPill, { status: gmailBadge.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPill, { label: gmailLabel, tone: gmailBadge.tone }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-white/12 bg-white/6 px-3 py-1 font-mono text-[11px] text-slate-200", children: wsUrl })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-right text-xs uppercase tracking-[0.28em] text-slate-400", children: [
              "trader badge source ",
              gmailBadge.system,
              " ",
              formatAge(gmailBadge.minTimestamp)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "mt-5 flex flex-wrap gap-3", children: navigation.map((item) => {
          const active = pathname === item.href;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: item.href,
              className: `rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.18)]" : "border border-white/12 bg-white/6 text-slate-200 hover:border-cyan-200/40 hover:bg-white/10"}`,
              children: item.label
            },
            item.href
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children })
    ] })
  ] });
};
const appCss = "/assets/styles-CSf9oFOr.css";
const Route$6 = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "Pulse Monitor TanStack"
      },
      {
        name: "description",
        content: "Cross-region heartbeat supervision with TanStack Start"
      }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  component: RootComponent
});
function RootComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RootDocument, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }) });
}
function RootDocument({
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { className: "antialiased", children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$5 = () => import("./systems-C-yB5yit.mjs");
const Route$5 = createFileRoute("/systems")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./regions-Cyniy7SP.mjs");
const Route$4 = createFileRoute("/regions")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./process-names-CESaqiri.mjs");
const Route$3 = createFileRoute("/process-names")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./hostnames-CQYRVpEI.mjs");
const Route$2 = createFileRoute("/hostnames")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./appnames--ZpYvCIW.mjs");
const Route$1 = createFileRoute("/appnames")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-BkBW05hY.mjs");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SystemsRoute = Route$5.update({
  id: "/systems",
  path: "/systems",
  getParentRoute: () => Route$6
});
const RegionsRoute = Route$4.update({
  id: "/regions",
  path: "/regions",
  getParentRoute: () => Route$6
});
const ProcessNamesRoute = Route$3.update({
  id: "/process-names",
  path: "/process-names",
  getParentRoute: () => Route$6
});
const HostnamesRoute = Route$2.update({
  id: "/hostnames",
  path: "/hostnames",
  getParentRoute: () => Route$6
});
const AppnamesRoute = Route$1.update({
  id: "/appnames",
  path: "/appnames",
  getParentRoute: () => Route$6
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$6
});
const rootRouteChildren = {
  IndexRoute,
  AppnamesRoute,
  HostnamesRoute,
  ProcessNamesRoute,
  RegionsRoute,
  SystemsRoute
};
const routeTree = Route$6._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true
  });
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  ConnectionPill as C,
  EMPTY_HEARTBEAT_GROUP_FILTERS as E,
  HealthPill as H,
  MetricCard as M,
  Panel as P,
  EmptyPanel as a,
  formatTimestamp as b,
  deriveGroupHealthViews as c,
  deriveRegionHealthViews as d,
  useHeartbeatEndpoint as e,
  formatAge as f,
  formatFreshnessWindow as g,
  router as r,
  summarizeMonitor as s,
  useHeartbeatGroups as u
};
