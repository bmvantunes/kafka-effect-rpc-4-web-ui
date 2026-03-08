# Tomorrow Plan

## Current Project
- Path: `/Users/bruno/projects/new-kafka-effect-v4`
- Goal: enterprise-grade Effect v4 beta.27 Kafka + RPC + Next.js heartbeat monitor

## What Is Already Working
- Repo is split into `backend/`, `shared/`, and `web-ui/`.
- Shared contract owns heartbeat identity, grouped RPC query schema, and health payload.
- Heartbeat identity is now `{ region, system, appName, hostname, processName }`.
- Backend maintains one normalized leaf projection plus generic per-dimension indexes.
- Kafka tombstones delete entries from backend memory.
- UI no longer ingests the full world; it opens grouped subscriptions per screen.
- Navbar trader badge already subscribes to `Gmail` only.
- Regions, systems, app names, hostnames, and process names pages render from grouped queries, not raw heartbeat state.

## Important Context / References (Local Projects)
- Effect v4 playground/reference:
  - `/Users/bruno/projects/effect-4/effect-smol`
- Production-ish Effect code reference:
  - `/Users/bruno/projects/t3code`

## Priority Tasks For Tomorrow
1. Add integration tests around `SubscribeGroups` and Kafka tombstones.
2. Add drill-down filters that combine `system`, `appName`, `hostname`, and `processName`.
3. Add expected-region or expected-host inventory once the compacted topic model lands.
4. Decide whether the dashboard should expose host counts alongside process counts.
5. Revisit Node-side RPC smoke tooling; browser/runtime path is good, but direct Node probe was flaky.

## Commands To Resume Quickly
- Start Kafka:
  - `cd backend && docker compose up -d`
- Start consumer:
  - `cd backend && npm run start:consumer`
- Start producer:
  - `cd backend && npm run start:producer`
- Start UI:
  - `cd web-ui && npm run dev`

## Notes
- `/health` and `/ready` are for ops; the UI itself is websocket-driven.
- The backend currently keeps one canonical process-level projection and derives grouped views from it.
- Keep exactly one producer and one consumer process during manual validation.
