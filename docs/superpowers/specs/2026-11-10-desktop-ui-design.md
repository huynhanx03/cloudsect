# CloudSect — desktop UI specification

Status: implementation reference for the first synthetic desktop UI, reflecting the user's latest island correction. See the application README for current implementation and verification status.
Scope: first runnable macOS UI milestone, using explicitly synthetic observations. Real CLI collection is a later milestone with its own parser/accounting spec.

## 1. Product and decisions

A pleasant desktop control room for named coding agents, visualized as a floating cultivation sect. Keep official CLI harnesses. Fast inspection of tasks matters more than decorative motion. Work offline; Go backend comes later.

Confirmed stack: Tauri 2 + Rust, React + TypeScript + Vite, direct Three.js scene. The user accepted TS after discussing performance; this is not an all-Rust UI. No runtime Node server.

Latest correction overrides the old provider mountain concept:

- Each island belongs to a user-defined agent, with editable name and robe color.
- Each agent can have several tasks/sessions on its island, arranged in task areas.
- CLI source (Codex, Claude, Gemini) is independent of island ownership; Antigravity is grouped under Gemini as requested.
- Two agents using Codex can own different islands. Never place a session by provider alone.
- Agent has `islandId`; session has nullable `agentId`. Session inherits its island from its assigned agent, without another writable island field.
- One island has at most one assigned agent in this milestone; one agent has exactly one island. Empty islands are allowed. Creating an agent creates a dedicated island. Moving it to an occupied island is rejected, not an implicit swap.
- Unassigned sessions are visible in “Chưa phân công / Unassigned”, with no invented owner. Assignment affects display organization only, never starts, stops or transfers CLI work.
- Normalize Antigravity to the Gemini source label in the UI and source filters.

Builder decisions proposed here: one-island-per-agent constraint, initial UI dependencies and performance targets below. These are implementation choices, not claims that the user specified every detail.

## 2. Approaches considered

| Approach | Trade-off | Decision |
| --- | --- | --- |
| Tauri + React + direct Three.js | Broad UI ecosystem, reuses visual reference, WebView costs must be measured | Selected in conversation |
| Rust UI + Bevy | Rust throughout and strong 3D tools; recreate the scene and app UI; no inherent guarantee of lower power | Not selected |
| Tauri + minimal vanilla TS | Fewer UI dependencies; substantially more manual component/state/accessibility work | Not selected for a multi-screen management app |

No comparative popularity or “lightest” claim is required. A release build on macOS is the evidence.

## 3. Delivery boundary

Milestone UI-1 includes: native shell, reusable UI kit, animated multi-island world, agent/island organization, task list/detail, demo statistics, demo spirit treasury, preferences, light/dark/system, VI/EN, reduced motion, compact mode and performance verification.

All observation data is synthetic and labeled globally and in exports. User-created organization/settings persist locally. Demo and future real stores must be namespaced. Demo session IDs never become real source identifiers.

Not in UI-1: reading personal CLI directories, launching/killing agents, terminal emulation, authentication, live quota polling, actual token awards, Go services, transcript collection/upload, automatic reviews, sync, accounts or paid economy. Add TODO capability notes, not fake working buttons.

## 4. Data contracts (plain data)

IDs are opaque strings. Provider IDs are source types, not ownership keys. DTOs carry fields only; validation/transitions belong to use cases. UTC instants are ISO strings; durations are integer seconds. Nonnegative token/stone amounts cross IPC as base-10 integer strings, avoiding JS integer overflow. Unknown is null plus availability/reason metadata, never numeric zero.

| Record | Required fields |
| --- | --- |
| Agent | `id`, `name`, `robeColor`, `islandId`, `createdAt` |
| Island | `id`, `name`, `layoutSeed`, `order` |
| Session | `id`, `sourceId`, `sourceSessionId`, `agentId: string|null`, `title`, `projectLabel: string|null`, `status`, `statusObservedAt`, `areaId`, `usage`, `activity` |
| QuotaWindow | `sourceId`, `accountLabel`, `windowLabel`, `remainingPercent: number|null`, `resetAt: string|null`, `observedAt`, `availability`, `reason` |
| Preferences | `version`, `locale: vi|en`, `theme: light|dark|system`, `quality: auto|low|balanced`, `motion: system|reduced|full`, `hiddenSessionIds` |
| WorkspaceSnapshot | `schemaVersion: 1`, `revision: number`, `mode: demo`, `agents`, `islands`, `sessions`, `quotas`, `statistics`, `treasury`, `preferences` |

Status values: `working`, `awaiting_input`, `idle`, `interrupted`, `unknown`. Display “Đang luyện công”, “Chờ chỉ dụ”, “Đang tĩnh dưỡng”, “Luyện công gián đoạn”, “Chưa rõ hành tung”. Source freshness is separate; stale evidence cannot silently count as current work.

`usage` is normalized presentation data: `freshInput`, `cachedInput`, `output`, `reasoningWithinOutput`, `total`, each integer-string or null, with availability/provenance. Fixture semantics: fresh + cached + output = total; reasoning is a subset. Real adapters must supply their own normalization later.

`activity`: known summed active seconds plus provenance. `statistics` distinguishes summed agent active seconds and union wall-clock active seconds, shows range/timezone, and includes precomputed buckets. UI never infers human working time or remaining subscription quota from tokens.

`treasury`: demo balance, demo earned amount, illustrative rule label and ledger rows. Demo rate 1,000 eligible tokens = 1 stone remains labeled illustrative. No production award engine is built until eligible buckets, rate and historical policy are decided.

Task-area IDs: `implementation`, `research`, `testing`, `design`, `council`, `rest`. This is local organization independent of actual session status: moving to council does not assert awaiting approval. Render the area within the assigned agent's island; unassigned sessions keep area metadata but no scene character.

Fixture scenarios: 0 sessions, 6 mixed sessions, 50 sessions, 200 sessions; include two Codex agents on separate islands, mixed sources on one agent, unassigned session, unknown quota, interrupted work, long VI/EN names and stale evidence.

## 5. Organization rules and commands

Rust owns native persistent organization, through use cases. Frontend demo adapter follows the same interface in browser QA. One shared JSON fixture defines demo observations; do not write a second business engine in TS. UI formatting/filtering and ephemeral selection stay in TS.

Commands and typed responses live under `application/src/platform/` with narrow Rust handlers:

- `load_workspace() -> Result<WorkspaceSnapshot, AppError>`.
- `apply_workspace_change(input: {expectedRevision, change}) -> Result<WorkspaceSnapshot, AppError>`.
- `set_window_mode(mode: full|compact) -> Result<(), AppError>`.

`change` is a tagged union: `createAgent{name,robeColor,islandName}`, `renameAgent{agentId,name}`, `renameIsland{islandId,name}`, `setRobeColor{agentId,color}`, `assignSession{sessionId,agentId|null}`, `moveAgent{agentId,islandId}`, `setSessionArea{sessionId,areaId}`, `setSessionHidden{sessionId,hidden}`, `updatePreferences{patch}`. Omit deletion until handling abandoned sessions and island ownership is designed. New empty islands are not necessary in UI-1: moves can use existing unoccupied islands from fixtures; arbitrary island editing is deferred.

Names: trim outer whitespace, require 1–40 Unicode scalar values; count consistently in Rust and TS. Accept Vietnamese input and IME without premature validation. Robe colors come from a curated 8-color palette. Island names have the same name rules. Show recoverable inline validation; do not require names to be unique.

Validate entity existence, island vacancy, area/color values and revision. Persist successfully before publishing a new snapshot. A failed save preserves the previous authoritative state and user's draft. Conflicting revision returns `conflict`; reload and explain, never silently overwrite. Errors use machine codes `validation`, `not_found`, `conflict`, `storage`, `unsupported`; localized UI owns human wording.

Hide is reversible and removes the character from the world/default list; “show hidden” restores access. It must not alter observed status or totals. Selecting a disappearing/hidden session closes its inspector gracefully. Peak navigation uses island/agent ID, never provider ID.

## 6. Screens and interactions

### Main window

Default 1440×900 logical pixels, minimum 1000×680. Native title bar/traffic-light safe area. Header: CloudSect, DEMO indicator, treasury, theme/language/settings. Quiet navigation: Sơn môn / Sect, Nhiệm vụ / Tasks, Thống kê / Statistics. Use the approved broad floating-island composition; adapt labels/selection to agents.

Sect: scene dominates. Island navigation names agents and counts their sessions. Click an island to focus; click a disciple for its session inspector; offer reset camera and keyboard-accessible equivalents in the list. Characters represent sessions; each uses the owning agent's robe color, source badge remains readable in UI. Inspector: agent/CLI, title, project, observed state/freshness, token breakdown, known time, area selector, assignment, hide. New-agent dialog creates its island.

At smaller width the inspector overlays instead of shrinking the scene beyond usability. At high counts show detailed characters for at most 24 prioritized visible sessions (selected, working, awaiting input first, stable ID tie-break); remaining sessions are represented by area count markers. Full list still contains every session. The limit is a configurable render policy, not a session limit.

Tasks: searchable by title, agent, project and source; filters for agent, source, observed status, hidden/unassigned. Shared inspector and assignment control. Stable row keys, virtualize above 50 rows; never make 3D picking the only way to select.

Statistics: range presets today/7d/30d; source and agent filters. Show token categories, summed active vs wall-clock time, per-agent and per-source tables, daily series and quota windows with reset/source/freshness. Fixture range/filter changes must change values consistently, not just labels. Missing data shows an explanation; quota bars state remaining/used explicitly and keep account/window scope.

Treasury drawer: balance, earned amount, sample rule and demo ledger, no purchase or cash-value implication. Settings: theme, language, motion, quality, demo data explanation. Exports include mode, schema version, range, applied filters and generated time; no transcripts.

### Compact view

Use the same native window resized/restored between modes, avoiding two simultaneous WebGL scenes. Target 380×300 logical pixels. Show one selected agent island, active/awaiting counts, DEMO label and expand/hide controls. Detail actions return to main UI. Always-on-top is optional user preference after native validation, not an assumed capability.

Closing hides the app to tray; explicit Quit exits. No CLI termination either way. Rendering must stop when hidden even if the JS visibility API does not change: native visibility/minimized events must feed the scheduler. Saved full bounds must be clamped to available displays after unplugging a monitor. Click-through/transparency and Spaces tricks are deferred.

## 7. Visual and reusable UI direction

Preserve the approved scene identity: floating rocky islands, layered pavilions, jade crystal spirit stones, bamboo/blossom/lotus, restrained cloud sea, diagonal camera. Do not regress to a flat dashboard or use provider colors as ownership identity. Use procedural shared assets first; no unlicensed game assets. Keep generated stone provenance.

Panels: warm ivory in light theme, ink/slate in dark theme, jade action accents and restrained gold treasury accents. Provider colors only identify source badges; agent robes use assigned palette. No theme-wide neon, heavy blur, constant bloom or live point lights per lantern.

Typography: local/system sans stack with complete Vietnamese coverage; serif title accents only. Tabular digits for amounts. Semantic CSS variables for surfaces/text/borders/interaction/status, separate from primitive palette. No hard-coded domain colors scattered through components. Scene consumes a translated theme palette, not raw CSS queries on each frame.

Shared primitives, customized from Radix where applicable: Button/IconButton, Dialog/Drawer, Select, Tabs, Tooltip, Switch, Field, Badge, EmptyState, ErrorState, Metric, DataTable shell. Domain components: AgentBadge, SourceBadge, StatusBadge, QuotaMeter, TokenBreakdown, SessionInspector, AgentEditor. Share SessionInspector between world and tasks; do not create a generic schema-driven screen builder. Extract duplication when an actual second consumer exists.

Accessibility: logical keyboard order, visible focus, Escape closes dialogs/restores focus, icon labels, non-color status signals, text alternatives to scene, reduced motion, readable contrast (4.5:1 normal text). VI/EN all user-visible strings and native tray copy; Intl formatting with explicit timezone/range. App screens are code-first implementations of the existing reference; no new visual direction workshop needed.

States: initial loading skeleton, no agents/sessions with useful create/unassigned action, storage error with retry preserving draft, unknown/stale source, empty filter result with reset, WebGL unavailable/context lost with functional task-list fallback, offscreen/hidden/reduced-motion, window restore failure.

## 8. Folder and domain boundaries

All production desktop code, logic, fixtures and assets stay inside `application/`. Documentation stays in root `docs/`; future Go service is outside `application/`. Do not create a second root frontend or shared mega-package.

```text
application/
  README.md
  package.json, package-lock.json, index.html, vite.config.ts, tsconfig*.json
  src/
    app/                 # composition, navigation, bootstrap, providers
    domains/
      agents/            # agent/island editing, ownership UI
      sessions/          # task list, filters, inspector, assignment UI
      statistics/        # reports and range/source/agent filters
      treasury/          # spirit-stone display and demo ledger
      settings/          # appearance, locale, motion, quality
      sect/              # world/compact UI, scene projection adapter
    scene/
      runtime/           # renderer, camera, scheduler, lifecycle, resource registry
      world/             # island/pavilion/tree factories, shared materials/geometry
      disciples/         # pooled character visuals, instancing and picking
    shared/
      ui/                # reusable primitives, no domain imports
      styles/            # tokens, themes, typography, motion
      i18n/              # vi/en dictionaries and formatting
    platform/            # WorkspaceGateway, Tauri and demo adapters, DTO contract
    fixtures/            # synthetic snapshots; one observation source
  public/assets/         # original/licensed static assets + provenance
  src-tauri/
    Cargo.toml, Cargo.lock, tauri.conf.json, capabilities/
    src/
      lib.rs, main.rs    # composition only
      commands/          # thin IPC handlers
      domains/
        workspace/       # snapshot and revision orchestration use cases
        agents/          # plain records + organization use cases
        sessions/        # assignment/hiding use cases, no CLI collector yet
        settings/        # preference use cases
      infrastructure/    # plugin-store adapter, demo fixture loading, native windows
    tests/               # meaningful owning use-case integration scenarios
  tests/                 # UI behavior, browser flows and fixtures
```

Import direction: app → domains → shared/platform contracts. No domain imports another domain's internals; use small public exports or compose in app. Scene knows only SceneProjection, never Tauri, raw logs or React. `sect` maps WorkspaceSnapshot into SceneProjection; scene emits selection intents. No React state writes in the animation loop. Rust commands → use cases → narrow persistence adapter; models remain plain. Avoid generic repository/framework layers and one-crate-per-domain until real complexity demands them.

## 9. Libraries and dependency policy

Baseline: Tauri 2 official packages/CLI; React/ReactDOM; TypeScript/Vite; Three.js; Zustand for selector-based shared UI state; Radix primitives only as needed; lucide-react named icons; i18next/react-i18next; clsx; TanStack Virtual for long lists; Recharts lazy-loaded only on statistics. CSS modules + semantic CSS variables, no second styling system. Test: Vitest, Testing Library/user-event, Playwright for browser flows. Official Tauri plugin-store for organization/preferences, accessed only through Rust use cases. SQLite reserved for real tracking/history, not installed merely to draw demo statistics.

Use current compatible stable versions verified at scaffold time, no prereleases. Commit package-lock.json and Cargo.lock. Record actual versions in application README. Do not upgrade the reference's vendored Three automatically; install and pin a chosen supported production version and port deliberately. No Next.js/SSR, Electron, Node sidecar, React Three Fiber, GSAP or physics engine by default. Add a library for a demonstrated need, inspect license and bundle cost; do not implement focus traps, virtualization or internationalization from scratch.

## 10. Performance contract

The following are engineering targets, not measured results. Record actual Mac model/RAM/OS, build mode, viewport, pixel ratio, sample size and tool versions. Profile packaged release builds; dev-mode/StrictMode measurements are not release claims.

- One WebGL canvas/context, shared between full/compact modes.
- Balanced scene cap: 30 fps; compact: 15 fps. Reactive one-shot rendering when motion paused/reduced; no permanent RAF loop in static/hidden/statistics views.
- Coalesce invalidations. Hidden/minimized/scene-unmounted: cancel RAF, animation timers and visual update loops. Resume uses fresh time; no catch-up simulation jump.
- Native hidden signal and document visibility both gate rendering. Visible unfocused compact view may animate at its cap; do not equate unfocused with hidden.
- Cap scene pixel ratio at 1.5 balanced, 1.0 low/compact. Auto starts balanced; downgrade to low if rolling p95 rendered-frame CPU time exceeds 33 ms continuously for 10 seconds. No automatic upgrade until next launch or explicit quality change. These are tuning defaults to verify, not benchmark results.
- Frustum culling, instanced repeated props, merged static meshes where useful, LOD for distant islands; bound animated characters and DOM labels. Frustum culling does not remove every hidden-behind-object cost. No custom general occlusion engine in UI-1.
- Pool geometries/materials/textures; dispose owned resources/listeners on unmount/context rebuild. Pause offscreen character animation as well as skipping draw submission.
- No dynamic shadow maps in the initial balanced preset; baked/contact-blob shading and limited transparency. Allocate a visual effect only after profiling.
- Scene imports lazily; list/settings work before WebGL is ready. Statistics chunk not imported just to display world counters.
- UI receives at most 4 coalesced snapshot changes/second under synthetic burst. User input feedback is immediate; animation values never enter the workspace store each frame.
- 200-session fixture: only viewport rows plus overscan mounted, at most 24 detailed characters, remaining represented by counts.
- Reference target: MacBook Air M1 8 GB or closest available Mac, 1440×900. Visible balanced p95 rendered-frame CPU work ≤25 ms at 30 fps; filter/select response ≤100 ms under 200-session fixture.
- Hidden/idle 60-second sample: zero scene-render calls after final hide, total app process-group average CPU target ≤1%, resident memory target ≤300 MiB in 6-session fixture. Process-group accounting must include WKWebView helper processes; do not call summed shared RSS a precise unique-memory value. GPU/energy measured separately in Instruments/Activity Monitor.
- No monotonic resource growth after 20 full/compact/navigation cycles, measured after cleanup; report JS heap and renderer resource counts alongside native memory.

If targets fail, reduce scene work before adding runtime complexity. Record failures honestly; do not trade correct tracking for attractive benchmark numbers.

## 11. Validation and acceptance

Automated tests own behavior: Rust workspace use-case tests for organization/revision/persistence errors; React user flows for filters, selection, assignment, hiding, validation, storage errors and language/theme persistence. No constants/constructor/DTO-only tests. Scene lifecycle tested through mounting/navigating/hiding/context failure, observing draw counts and interactions; low-level scheduler tests only if timing cases cannot be reached reasonably through that entry point.

Playwright browser QA covers UI/scene fallback; it does not prove macOS WebView/IME/native window behavior. Native macOS manual checklist is mandatory: packaged launch, Vietnamese IME, traffic lights/tray/quit, hide/minimize/restore, monitor unplug, compact bounds, theme and disk error recovery. Assert user-facing outcomes, not screenshots of exact text constants. Screenshots are reviewed at 1440×900 and 1000×680, both themes and VI/EN; compact 380×300; include long names/unknown data. Capture reference screenshots into docs, not personal data.

UI-1 done when these flows work with labeled demo data, save survives app restart, native lifecycle passes, screenshots preserve scene quality, and performance report contains measured results plus unresolved limitations. No claim of live tracking until a separate Codex end-to-end milestone ships.

## 12. Later milestones and open policy

UI-2: Codex-only real observation → normalized events → SQLite dedup/accounting → truthful snapshot, using opt-in source access. Separate spec before implementation; investigate existing parsers, do not reimplement blindly. Claude/Gemini/Antigravity follow capability by capability. Unassigned real sessions remain unassigned until explicit mapping exists.

Open before real awards: conversion rate, eligible token categories, historical import and correction/reversal policies. No open item here prevents UI-1, because all currency and usage in that milestone are explicitly demo.

## Sources

- [Tauri frontend/Vite support](https://v2.tauri.app/start/frontend/).
- [Tauri process model and system WebView](https://v2.tauri.app/concept/process-model/).
- [Three.js rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html).
- [Radix accessible primitives](https://www.radix-ui.com/primitives/docs/overview/introduction).
- [TanStack Virtual](https://tanstack.com/virtual/latest/docs/introduction).

These support capabilities, not comparative performance claims. See docs/research.md for telemetry research and visual references.
