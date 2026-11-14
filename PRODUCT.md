# Product

<!-- impeccable:product-schema 1 -->

## Platform

macOS desktop first. Tauri 2 hosts the desktop application; the current UI is React, TypeScript and Vite in the system WebView, with Rust commands for native behavior and local workspace storage.

## Users

Software developers who run several AI coding agents through each provider's official CLI and want one place to see what every named agent is doing.

## Product Purpose

CloudSect organizes and tracks agent sessions, token usage, activity time and quota. Success means a developer can glance at the sect, recognize which agents are working, waiting or resting, and open the relevant session details when needed.

## Positioning

Each user-named agent owns a personal island, and its task sessions appear on that island regardless of which CLI runs them. CloudSect observes and organizes work while the provider's CLI remains the harness where the agent operates.

## Operating Context

- The app is a desktop companion for multiple local CLI agents; it does not replace their official CLI harnesses.
- The main view is a wide, scenic sect world. Details appear when the user selects an island, agent or session.
- A compact, always-on-top window is intended for keeping a small status view near the desktop corner.
- The initial release targets macOS; Vietnamese and English, and light, dark and system themes are required.

## Capabilities and Constraints

- Agent profile and island assignment are user-controlled. Sessions can remain unassigned until the user assigns them.
- CLI source is tracked separately from agent ownership. Antigravity is presented under the Gemini source.
- Current screens use synthetic sample data. Live CLI collection and a Go backend are future work.
- Optional raw prompt/output capture may later be sent to the Go API. UI-1 does not read CLI histories or upload transcripts.
- Spirit-stone balances and the sample rate of 1,000 eligible tokens per stone are illustrative, not a real account balance or settled production accounting rule.
- Keep unknown or stale usage distinct from zero usage. Time active, summed agent time and elapsed wall time represent different measures.

## Brand Commitments

The product name is CloudSect. The user wants the agent-management experience framed as a cultivation sect: named agents are daoists, islands are their mountains, and earned spirit stones are its resource. The tone should make management enjoyable while keeping the information accurate and easy to understand.

## Evidence on Hand

- `application/src/fixtures/demo-workspace.json` contains synthetic agents, islands, sessions and usage figures.
- `docs/prototype/assets/spirit-stone.png` is the approved generated spirit-stone artwork with its generation prompt recorded in a provenance sidecar.
- No live provider telemetry or real account balance is available yet.

## Product Principles

- Keep provider harnesses in control of agent execution; CloudSect observes and organizes.
- Let the user decide which agent owns a session; never infer island ownership from the CLI source.
- Make the living world the main way to scan activity, with details available on selection.
- Preserve uncertainty and data provenance in token, quota and time displays.
- Keep transcript capture and server delivery opt-in and deferred until the Go API is specified.
