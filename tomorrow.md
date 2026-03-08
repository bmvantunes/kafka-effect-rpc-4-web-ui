# Tomorrow Plan

## Current Project
- Path: `/Users/bruno/projects/new-kafka-effect-v4`
- Goal: enterprise-grade Effect v4 beta.27 Kafka + RPC + Next.js heartbeat monitor

## What Is Already Working
- Effect versions pinned to beta.27 in root and `web-ui`.
- UI uses `@effect/atom-react` hooks (no custom atom hook bridge).
- Kafka producer emits heartbeat events.
- Consumer ingests heartbeats and maintains in-memory region/system projection.
- RPC stream + UI are connected.
- Dynamic UI rendering confirmed: region cards appear from live data (no hardcoded regions).
- Playwright validation passed with:
  - `hasConnected true`
  - `cards 3`
  - `regions ["Asia","Europe","USA"]`

## Important Context / References (Local Projects)
- Effect v4 playground/reference:
  - `/Users/bruno/projects/effect-4/effect-smol`
- Production-ish Effect code reference:
  - `/Users/bruno/projects/t3code`

## Priority Tasks For Tomorrow
1. Remove remaining manual websocket dependency from backend if fully unused (`ws` in root `package.json`) and verify no runtime regressions. Uninstall `ws`.
2. Add an explicit RPC health/readiness endpoint strategy:
   - RPC probe call.
   - Add smoke check command to scripts.
3. Add reconnect/fault tests for UI status transitions:
   - `connecting -> connected -> reconnecting -> disconnected -> connected`.
4. Add integration test asserting snapshot + live stream semantics:
   - New client receives full snapshot first.
   - Then receives updates only.
   - use @playwright/test - uninstall playwright.
5. Add consumer startup guardrails:
   - Keep current port-precheck and fail-fast behavior.
   - Add test for stale process/port collision scenario.
6. Add observability polish:
   - Structured logs around stream subscribe/disconnect counts.
   - Optional telemetry counters for RPC clients connected and updates pushed.
7. Verify strict dependency policy:
   - Re-check lockfiles for accidental version drift.
   - Document known transitive `@effect/platform-node-shared` nuance.

## Commands To Resume Quickly
- Start Kafka:
  - `docker compose up -d`
- Start consumer:
  - `npm run start:consumer`
- Start producer:
  - `npm run start:producer`
- Start UI:
  - `cd web-ui && npm run dev`

## Notes
- If UI shows `connected` but zero cards, check for stale old process binding `:3001` first.
- Keep exactly one producer and one consumer process during validation.
