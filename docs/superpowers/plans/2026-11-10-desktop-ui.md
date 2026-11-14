# CloudSect Desktop UI Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task in the current session. Use subagent-driven-development only if explicitly selected; do not introduce parallel implementation by default. Steps use checkbox syntax.

**Goal:** Ship a clean, attractive macOS CloudSect demo app with agent-owned islands, reusable management UI and measured rendering behavior.

**Architecture:** All desktop code lives in `application/`. React composes domain screens, Rust use cases persist organization/preferences, and an independent Three.js runtime receives scene projections. A typed gateway keeps browser QA and Tauri behind the same contract without putting CLI accounting in UI components.

**Tech Stack:** Tauri 2/Rust, React/TypeScript/Vite, Three.js, Zustand, selected Radix primitives, CSS modules/tokens, i18next, lucide-react, TanStack Virtual, lazy Recharts, official Tauri plugin-store. Vitest/Testing Library/Playwright plus Rust integration tests. npm/package-lock and Cargo.lock.

**Spec:** [Desktop UI specification](../specs/2026-11-10-desktop-ui-design.md).

**Status:** Initial implementation is present on `codex/cloudsect-ui`: app shell, domain screens, local demo/Tauri gateways, Rust local-storage use cases, bilingual themes, synthetic statistics and a lazy Three.js scene are in place. npm typecheck, lint and production build pass. Native Rust/macOS verification remains pending because this environment has no Rust toolchain; behavior/performance scenarios in the remaining checklist still need a native-capable QA pass.

## Global constraints

- All production desktop code, logic, fixtures and assets stay inside `application/`.
- Each island belongs to a user-defined agent; CLI source is independent of island ownership.
- Agent has `islandId`; session has nullable `agentId`. Session inherits its island from its assigned agent, without another writable island field.
- Models/DTOs remain plain data; use cases own validation, transitions and persistence. Tests start at owning behavior entry points.
- UI-1 uses explicitly synthetic data. No live CLI collection, actual token awards, transcript upload or Go server.
- Balanced scene cap: 30 fps; compact: 15 fps. Hidden/minimized/static views do not run permanent visual loops.
- Light/dark/system; VI/EN; reduced motion; list fallback when 3D is unavailable.
- Unknown/stale is not zero/idle. Hide never stops CLI work or changes totals.
- Do not commit unrelated user work. Each task can be committed independently when implementation is authorized; inspect staged diff before each commit.

## Review focus

1. Agent ownership vs source grouping: two Codex agents on different islands and a mixed-source agent — Task 2/4.
2. Persistence error/conflicting edits: retain current authoritative snapshot and user's draft — Task 2/4.
3. Hidden native window while WebView visibility stays visible: no scene renders, restore without animation catch-up — Task 5/7.
4. Unknown/stale quota and numeric amounts above JS safe integers: truthful display/export — Task 6.
5. 200 tasks, long Vietnamese IME names and missing WebGL: usable list/assignment, bounded scene work — Task 4/5/7.

## File map and interfaces

Directory responsibilities are defined in spec §8; do not create empty future domains. Introduce each module with its owning task. Each domain exports a narrow `index.ts`; no cross-domain internal imports. Rust stays one app crate with domain modules.

Canonical contracts in `application/src/platform/contracts.ts` mirror the field names in spec §4. `application/src/fixtures/demo-workspace.json` is the single baseline observation fixture bundled in both environments; scenario fixtures extend it for tests.

```ts
// platform/workspace-gateway.ts
interface WorkspaceGateway {
  load(): Promise<WorkspaceSnapshot>;
  apply(input: { expectedRevision: number; change: WorkspaceChange }): Promise<WorkspaceSnapshot>;
  setWindowMode(mode: 'full' | 'compact'): Promise<void>;
}
// gateway errors carry AppError code; UI does not parse human error strings.

// scene/runtime/types.ts (defined in Task 5)
interface SceneProjection {
  islands: Array<{ id: string; agentId: string | null; name: string; layoutSeed: number; order: number }>;
  disciples: Array<{ sessionId: string; agentId: string; islandId: string;
    areaId: string; robeColor: string; status: SessionStatus }>;
  selectedSessionId: string | null;
  focusedIslandId: string | null;
}
interface SceneLifecycle {
  nativeVisible: boolean; documentVisible: boolean; sceneActive: boolean;
  mode: 'full' | 'compact'; reducedMotion: boolean;
  quality: 'low' | 'balanced';
}
interface SectScene {
  update(projection: SceneProjection): void;
  setLifecycle(state: SceneLifecycle): void;
  setTheme(theme: SceneTheme): void;
  invalidate(): void;
  dispose(): void;
}
```

`WorkspaceChange`, `WorkspaceSnapshot`, `SessionStatus` and `AppError` are defined by Task 2. `SceneTheme` is the scene palette mapped from Task 3 tokens. `createSectScene(host, options)` in Task 5 returns `Promise<SectScene>`; options contain callbacks `onSelectSession(id: string)` and `onFocusIsland(id: string)`. Frame counters are debug diagnostics, not React application state.

Rust use-case entry points in `src-tauri/src/domains/workspace/service.rs`: `load_workspace(store: &dyn WorkspaceStore) -> Result<WorkspaceSnapshot, AppError>` and `apply_workspace_change(store: &mut dyn WorkspaceStore, input: ApplyWorkspaceChange) -> Result<WorkspaceSnapshot, AppError>`. `WorkspaceStore` is the small load/save persistence port, not a generic repository framework. Commands have the names in spec §5.

## Task 1 — Runnable desktop shell and UI foundation

**Files:** create `application/package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx`, `src/app/App.tsx`, `src/app/AppShell.tsx`, `src/shared/styles/{tokens,global}.css`; `src-tauri/{Cargo.toml,Cargo.lock,tauri.conf.json,capabilities/default.json}`, `src-tauri/src/{main,lib}.rs`; update `application/README.md`.

**Consumes:** accepted stack, spec visual reference and repository coding rules.
**Produces:** bootable Tauri shell; scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:ui`, `tauri`; route union `sect|tasks|statistics` in app state; in-app settings/treasury dialogs.

- [ ] Inspect installed Rust/Node/Xcode toolchains and current compatible stable dependency versions from official sources; record versions and minimum macOS target from actual chosen dependencies. Do not guess a universal minimum.
- [ ] Scaffold under `application/` only using official Tauri/Vite conventions. Install only dependencies needed now. Configure aliases, strict TS and recommended ESLint hooks/accessibility rules; no root Node project, server or SSR.
- [ ] Build a native shell with CloudSect title, global DEMO marker, loading/error boundary and the three navigation destinations; preserve standard macOS titlebar safe areas.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`; launch `npm run tauri dev` on macOS and manually navigate/resize. No constructor/smoke assertions added merely for scaffolding.
- [ ] Document exact commands and toolchain; review diff and make a focused shell commit.

## Task 2 — Workspace contract, persistent organization and fixture gateway

**Files:** create `src/platform/{contracts,workspace-gateway,tauri-gateway,demo-gateway}.ts`, `src/fixtures/demo-workspace.json`, `src/app/workspace-store.ts`; Rust `commands/workspace.rs`, `domains/workspace/{mod,model,service,ports}.rs`, `domains/{agents,sessions,settings}/{mod,model,service}.rs`, `infrastructure/{mod,workspace_store,demo_fixture}.rs`; tests `src-tauri/tests/workspace_behavior.rs`, `tests/workspace-flow.test.tsx`. Update composition files.

**Consumes:** Task 1 shell. **Produces:** gateway signatures above, revisioned persistent snapshot and selector subscriptions. `WorkspaceChange` is exactly spec §5 union. No unneeded Rust domain splitting into separate crates.

- [ ] Write failing owning-use-case tests: two same-source agents remain separate; assigning a mixed-source session preserves source; move to occupied island rejected; unknown agent/session rejected; stale revision rejected; save failure publishes no new revision; hiding preserves status/totals; reload persists edits. Use temporary/failing store at this boundary, no repo wrapper tests.
- [ ] Run `cargo test --manifest-path src-tauri/Cargo.toml --test workspace_behavior`; confirm failures exercise missing behavior rather than unrelated toolchain errors.
- [ ] Implement plain contracts and Rust services with trim/Unicode name constraints, curated robe palette, one-agent-per-island ownership, revisions and save-before-publish. Use official plugin-store as infrastructure; typed command errors use spec codes. Never persist demo and future real identities together.
- [ ] Implement TauriGateway plus browser-only DemoGateway for development/test. Browser adapter follows organization contract, no tracking/token engine; run the same observable gateway flow scenarios against it. Store returns per-slice stable selector results; do not regenerate every object per animation frame.
- [ ] Run Rust tests and `npm test -- tests/workspace-flow.test.tsx`; build/typecheck/lint. Verify corrupt local data gives recoverable storage error instead of silent reset. Commit behavior and contract.

## Task 3 — Shared design system, localization and settings

**Files:** create `src/shared/ui/{Button,Dialog,Select,Tabs,Tooltip,Switch,Field,Badge,EmptyState,ErrorState,Metric}.tsx` as needed; shared styles/tokens/theme modules; `src/shared/i18n/{index,vi,en}.ts`; `src/domains/settings/{index,SettingsDialog}.tsx`; `tests/settings-flow.test.tsx`. Update AppShell.

**Consumes:** Task 2 preferences and gateway; Task 1 navigation.
**Produces:** reusable primitives and theme/locale providers; resolved theme for scene; no domain imports from `shared/`.

- [ ] Read UI skill craft-floor before editing UI. Implement warm ivory/ink themes and jade accents derived from approved reference. Add only Radix primitives actually consumed, local sans typography with Vietnamese coverage, tabular numbers and shared spacing/focus/motion tokens.
- [ ] Write UI behavior tests for changing language/theme/motion, reopening/reloading persistence, keyboard dialog focus and failed save retaining user's selection/draft. Run `npm test -- tests/settings-flow.test.tsx` to confirm missing behavior fails.
- [ ] Implement settings via Task 2 gateway; theme resolves system preference, motion resolves OS setting, labels/tooltips/errors all use dictionary keys. Do not duplicate theme state in the scene.
- [ ] Run tests/typecheck/lint; inspect light/dark + VI/EN at both main sizes, keyboard-only interactions and system setting changes. Commit shared UI/settings.

## Task 4 — Agent islands and session management screens

**Files:** create `src/domains/agents/{index,AgentEditor,AgentBadge,IslandNavigator}.tsx`, `src/domains/sessions/{index,SessionList,SessionInspector,SessionFilters,SessionAssignment,StatusBadge,SourceBadge,TokenBreakdown}.tsx`, `src/domains/sect/{index,SectScreen,scene-projection}.tsx/.ts` as appropriate, `tests/session-management.test.tsx`. Use focused CSS modules beside components.

**Consumes:** shared primitives, gateway and workspace selectors. **Produces:** common selected-session state, organization UI and scene projection input. Agent edits never mutate CLI source.

- [ ] Write failing interaction tests: create/rename agent with dedicated island, select and assign unassigned task, same CLI on two islands, move to vacant/occupied island, filter by agent vs source separately, hide/show without totals changing, selected hidden task closes inspector, failed save retains draft. Include 40/41 Unicode-scalar names and Vietnamese composition events; validate after composition ends/submission.
- [ ] Run `npm test -- tests/session-management.test.tsx` and confirm expected behavior fails.
- [ ] Implement shared inspector between list and sect, reusable badges/fields and accessible island navigator. Provide assignment picker and unassigned section. In UI-1 do not add disabled launch/review/kill buttons as clutter.
- [ ] Add TanStack Virtual above 50 rows; 200 tasks remain searchable/selectable with bounded mounted rows, stable keys and sensible keyboard/focus behavior. Display whole task title in inspector when row truncates it.
- [ ] Run behavior tests/typecheck/lint; review 0/6/200 fixtures, mixed sources, long VI/EN and storage errors. Commit management screens.

## Task 5 — Port the sect scene and enforce render lifecycle

**Files:** create `src/scene/runtime/{create-sect-scene,types,render-scheduler,resources,camera}.ts`, `src/scene/world/{island,pavilion,foliage,materials}.ts`, `src/scene/disciples/{characters,picking}.ts`, `src/domains/sect/{SceneCanvas,CompactSect}.tsx`, extend `scene-projection.ts`; `public/assets/spirit-stone*` with provenance; `tests/scene-lifecycle.test.tsx`, `tests/scene.spec.ts`.

**Consumes:** Task 4 selection/ownership and Task 3 theme/motion. **Produces:** `createSectScene`/`SectScene` contracts above, independent of React/Tauri. Never import the prototype HTML wholesale.

- [ ] Write lifecycle integration scenarios: mount → select → navigate to statistics → zero subsequent draws; hidden native signal with visible document → zero draws; restore → fresh time; unmount/remount → listeners/resources released; context unavailable/lost → list fallback; 200 sessions → ≤24 detailed characters and count markers. Use injected clock/renderer at SceneCanvas boundary for deterministic tests; real WebGL browser flow verifies picking.
- [ ] Run `npm test -- tests/scene-lifecycle.test.tsx`; confirm behavior failures.
- [ ] Port broad floating-island composition into reusable factories with stable layout seeds and pooled geometry/materials. Agent identity determines island/color. Reuse shape families and vary landscaping; preserve jade crystals and original asset provenance. Theme/quality changes update shared resources without allocating a new scene each click.
- [ ] Implement coalesced render invalidation; motion capped 30/15 fps; cancel permanent loops for static/reduced/hidden/data routes. DPR capped 1.5 balanced and 1.0 low/compact. Auto initially balanced, downgrade to low if rolling p95 rendered-frame CPU time exceeds 33 ms continuously for 10 seconds; no automatic upgrade until next launch or explicit quality change. Mark these thresholds tuning defaults in report.
- [ ] Bound character/detail labels, skip offscreen animation and use instanced repeated scenery; cheap contact shading, no initial dynamic shadows. Stabilize camera selection; restore overview. UI labels update on projection/camera changes only, never full React tree each frame.
- [ ] Run lifecycle tests, `npm run test:ui -- tests/scene.spec.ts`, build/typecheck/lint; inspect world in both themes and compact. Record render counts/resources before and after navigation cycles. Commit scene.

## Task 6 — Statistics and demo spirit treasury

**Files:** create `src/domains/statistics/{index,StatisticsScreen,UsageChart,QuotaMeter,StatisticsFilters}.tsx`, `src/domains/treasury/{index,TreasuryDrawer,LedgerList}.tsx`, `src/shared/i18n/format.ts`, relevant fixtures; `tests/statistics-flow.test.tsx`, `tests/statistics.spec.ts`.

**Consumes:** snapshot statistics/quotas/treasury, agent/source identity and shared components. **Produces:** truthful demo reports, filters and export with provenance; lazy chart import.

- [ ] Write failing behavior tests for today/7d/30d and source/agent filter intersections, unknown/stale quota without zero-fill, reasoning subset without double count, totals above JS safe integer round-tripping export, hidden tasks still included in usage, distinct summed/union time and explicit demo conversion label.
- [ ] Run `npm test -- tests/statistics-flow.test.tsx`; verify failures. Use consistent timestamped fixture records to drive range/filter summaries; this is fixture presentation, not a production telemetry/award engine.
- [ ] Implement normalized-value formatting with Intl/BigInt at boundaries; chart values must declare bounded approximation if scaling exceeds safe range, exact table/export retains decimal strings. Scope quota to account/source window; do not attribute shared provider quota to a single island.
- [ ] Lazy-load Recharts on statistics, reuse Metric/QuotaMeter/TokenBreakdown and selected filters. Export mode/schema/range/filters/time. Ledger is labeled demo; no backend upload.
- [ ] Run tests, browser export flow and build checks; inspect both themes, large amounts, empty range and 200-task grouping. Commit reports/treasury.

## Task 7 — Native compact mode, lifecycle and final quality gates

**Files:** create `src-tauri/src/commands/window.rs`, `src-tauri/src/infrastructure/windows.rs`, `src/platform/window-lifecycle.ts`; complete CompactSect/AppShell wiring; `tests/navigation.spec.ts`, `docs/performance/desktop-ui-1.md`, `docs/qa/desktop-ui-1.md`; update README and application README.

**Consumes:** same SceneCanvas/runtime and all prior screens. **Produces:** packaged macOS demo application and evidence/limitations.

- [ ] Add behavior tests around the window-mode command boundary: failed native transition leaves controls recoverable; restoring full mode preserves selection/preferences and saved valid bounds; native hide stops scene even if document visibility is unchanged. Integration/native checklist owns actual OS behavior.
- [ ] Implement same-window full/compact sizing with saved full bounds clamped to active displays, native visibility/minimize/restore signals, tray show/quit, close-to-hide and explicit quit. Never terminate CLI processes. Optional always-on-top is included only if verified; transparency/click-through deferred.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:ui`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`, `cargo test --manifest-path src-tauri/Cargo.toml`, `npm run tauri build`. Resolve actual failures; do not write tests that mirror constant values.
- [ ] Run UI skill detector once after the UI is complete, inspect findings and fix actual accessibility/quality issues. Capture/review 1440×900 and 1000×680 light/dark + VI/EN, compact 380×300, long names and unknown/error/WebGL fallback. Use native WKWebView checks for IME/focus; browser Chromium screenshots are not proof of native behavior.
- [ ] Profile release app on available Mac and disclose distance from M1/8GB reference. Record p95 CPU frame work, selection/filter latency, scene draw counts hidden, app + WebView process-group CPU/memory, renderer resource/JS heap stability across 20 navigation/compact cycles, energy sample. Spec targets are gates to investigate, never invented results; list missed targets and mitigations.
- [ ] Complete native checklist: packaged launch, titlebar/tray/quit, minimize/hide/restore, Vietnamese typing, monitor unplug/bounds recovery, persistence restart, failed save, compact selection. Update docs with runnable commands and demo-only limitations; commit UI-1 after diff review.

## Completion and next milestone

UI-1 requires all seven deliverables and recorded native/performance evidence, not just `npm run build`. Review against spec §11 and latest agent-owned island rule. Do not claim live tracking.

Next: prepare separate Codex collection/SQLite spec with sample schemas/provenance, dedup/cumulative semantics, incremental file observation, source permissions and real status evidence. Reuse suitable licensed parser libraries after inspection. Claude/Gemini/Antigravity and real stone rules follow verified capabilities. Go backend, transcripts and cross-agent reviews stay TODO.

## Planning review

- Builder check: independent reviewer found no important unresolved product question for UI-1, including island ownership and mixed-source sessions.
- Self-review: all UI-1 scope mapped to Tasks 1–7; five review-focus failure classes have owning checks; real telemetry/accounting is intentionally a separate milestone.
- No code, dependencies, tests or performance measurements are represented as completed by this plan.
