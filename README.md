# CloudSect

A desktop sanctuary for your coding agents. Each named agent has its own island; its CLI tasks/sessions cultivate there. CLI source is independent of island ownership.

macOS first. Tauri/Rust desktop, with a Go backend planned later. Users continue working in the providers' official CLIs.

## Current state

The first synthetic desktop UI is implemented under `application/`: agent-owned islands, session management, statistics, spirit-stone ledger, VI/EN and light/dark settings. Live CLI collectors and the Go backend have not been implemented.

- [Application folder](application/README.md)
- [Desktop UI specification](docs/superpowers/specs/2026-11-10-desktop-ui-design.md)
- [Implementation plan](docs/superpowers/plans/2026-11-10-desktop-ui.md)
- [Product design and scope](docs/design.md)
- [Source research](docs/research.md)
- [Interactive 3D prototype](docs/prototype/README.md)
- [Coding rules](AGENTS.md)

## Run the UI preview

For the browser-based demo:

```sh
cd application
npm install
npm run dev
```

For the macOS shell, install Rust and Xcode Command Line Tools, then run `npm run tauri dev` from `application/`. The app uses synthetic data and does not run or stop a CLI. The older [interactive prototype](docs/prototype/README.md) is only a reference; it uses provider-owned mountains.

## Initial scope

- User-defined agents own islands; session assignment is independent of CLI source. Antigravity is presented under the unified Gemini source as requested.
- Named agents with customizable robes; multiple task/session disciples in areas on each agent island. Unassigned sessions remain visible.
- Token, activity and quota tracking, with unknown and stale states represented honestly.
- Spirit stones use a clearly marked demo rate of 1,000 eligible tokens to 1 stone; production eligibility and history rules remain undecided.
- Full window and a compact desktop view; light/dark and Vietnamese/English.

Cross-agent review and raw conversation upload are deferred. Keep a TODO for optional raw input/output capture and Go API delivery. The future Go backend can own profile data, stone history and raw payload storage.
