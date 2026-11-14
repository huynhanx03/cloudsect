# CloudSect — product design baseline

The current desktop specification is [Desktop UI design](superpowers/specs/2026-11-10-desktop-ui-design.md); its [implementation plan](superpowers/plans/2026-11-10-desktop-ui.md) covers UI-1. Read those together before implementation.

## Confirmed product direction

- macOS desktop application: Tauri 2 / Rust, React / TypeScript / Vite, Three.js. Performance is measured, not inferred from language choice.
- All desktop UI, scene, local logic, fixtures and Rust code live in `application/`.
- Each island belongs to a user-defined, named agent. That agent has multiple tasks/sessions on its island. CLI type does not determine island ownership.
- Agent has `islandId`; session has nullable `agentId`; source identity stays separate. Unassigned sessions remain visible rather than guessed into an island.
- Light/dark/system, Vietnamese/English, full and compact windows, reduced motion.
- Official CLI harnesses remain the place AI work runs. CloudSect observes and organizes; hide does not stop a CLI.
- Tracking token/time/quota and earned spirit stones are the longer-term goal. UI-1 uses labeled synthetic data; live Codex tracking follows separately.
- Go backend later for profile/stone persistence and optional raw input/output. Cross-agent review, uploads and training exports remain TODO.

## Visual reference and obsolete semantics

[The prototype](prototype/index.html) is an approved visual/interaction reference: large floating mountains, pavilions, disciples, jade crystals and a quiet management UI. It is not production architecture or real telemetry.

Its provider-owned mountains, fixed provider robe colors and old grouping logic are superseded by the user's latest correction. Preserve scenery quality; implement agent-owned islands. Mountain names are editable, not a fixed Codex/Claude/Gemini taxonomy.

## Scenic home

The home view is a wide, cinematic floating sect world, not a dashboard layout with scenery inside a card. Let large, varied islands and readable cultivators fill the window. Keep only small, floating navigation, spirit-stone balance and activity controls over the scene. Hide the selected agent/session inspector on launch; open it when the user selects an island or cultivator, and close it without taking the world away. Keep the authored interactive islands in front of a compressed generated cloud-sea backdrop in `application/src/shared/assets/sect-cloudscape.webp`. Use the approved generated jade cluster from `docs/prototype/assets/spirit-stone.png` for currency wherever a small icon appears.

## Accounting principles for future tracking

Keep source/account/device/session/observation identities distinct. Normalize provider token semantics independently and deduplicate before aggregating or awarding. Cached input and reasoning can overlap parent categories. Handle cumulative snapshots, replay/forks, corrections and out-of-order observations explicitly. Token usage does not establish remaining subscription quota.

Known active intervals, summed agent time and union elapsed time are different measurements; do not invent human work time. Unknown/stale evidence is never zero/idle. Keep provenance and freshness visible.

Raw usage and versioned integer/fixed-point spirit-stone ledger remain separate. Conversion rate, eligible buckets and historical import/reversal policy are not yet set; prototype 1,000 tokens = 1 stone is illustrative only.

## Implementation boundary

First ship a native demo UI with actual performance/native-window validation, then specify a real provider adapter end-to-end. Native transparency, click-through, Spaces and distribution/signing remain unproven until explicitly validated. Keep models plain and business rules in use cases, as AGENTS.md requires.
