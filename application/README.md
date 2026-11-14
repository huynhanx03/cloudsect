# CloudSect application

Home for all desktop app code, UI, 3D runtime, Rust use cases, fixtures and assets.

Stack: Tauri 2 / Rust + React / TypeScript / Vite + Three.js. Go backend stays outside this directory when needed.

Read [the desktop specification](../docs/superpowers/specs/2026-11-10-desktop-ui-design.md) and [the implementation plan](../docs/superpowers/plans/2026-11-10-desktop-ui.md) before extending a domain.

Latest ownership rule: island belongs to a named agent, not to an AI provider. Agent has islandId; session has nullable agentId; CLI source remains independent. This supersedes the old provider mountains in the reference prototype.

First milestone is a complete, explicitly demo desktop UI. Real CLI tracking and SQLite history follow separately. Keep production code here; keep docs/prototype as a design reference only.

Current screen domains include sect/islands, task sessions, statistics, treasury and settings. Browser demo state uses local storage; the Tauri shell stores the same workspace snapshot through `tauri-plugin-store`. Agent name and robe color identify an agent, while the independent session source identifies Codex, Claude or Gemini (including Antigravity). The sample economy uses 1,000 eligible tokens = 1 stone and is labeled illustrative; its displayed balance is not a real account balance.

Raw prompt/output collection and delivery to the future Go API remain TODOs. UI-1 neither reads local CLI histories nor uploads transcripts.

## Visual language

The 3D floating islands carry the visual identity; management panels stay quiet and readable.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| Mist | `#E8EEE8` | `#1B2825` | Main canvas and scene atmosphere |
| Jade | `#397A61` | `#8BC7A5` | Primary action and cultivation state |
| Inkstone | `#283A34` | `#E6EDE7` | Main type and selected UI |
| Parchment | `#FAF8F1` | `#263531` | Inspector, popovers, readable surfaces |
| Old Gold | `#AA8550` | `#D8B778` | Spirit stones and subtle highlights |
| River Slate | `#788880` | `#A5B3AA` | Secondary information and dividers |

DM Sans carries controls and data; Noto Serif Variable accents sect names and page titles. Both fonts ship locally for Vietnamese text. Left-align management content. Let the scene own the central canvas; place navigation on the left and the selected agent/session inspector on the right.

```text
┌ navigation ──┬────────── named-agent islands / 3D sect ───────────┬ inspector ┐
│ CloudSect    │  island · sessions · task districts                │ agent     │
│ Sect         │                                                     │ sessions  │
│ Tasks        │                                                     │ details   │
│ Statistics   │                                                     │           │
└──────────────┴─────────────────────────────────────────────────────┴───────────┘
```

The UI-UX Pro Max search returned a generic Swiss/cyan system on retry; I kept the committed jade, parchment and xianxia scene direction instead. The 3D world is the single expressive element. Panels use spacing and fine dividers instead of a repeated card grid, with no neon HUD, glass blur or always-moving decoration.
