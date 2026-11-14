# Source research

Read-only reconnaissance captured during design. Revisions below identify the inspected checkouts, not guaranteed current versions. No runtime compatibility or battery benchmark was performed.

| Project | Inspected revision | Relevant material |
| --- | --- | --- |
| [Tokscale](https://github.com/junhoyeo/tokscale) | `82613d2` | Rust core, session parsers, scanning, cumulative counters and replay/dedup handling |
| [CodexBar](https://github.com/steipete/CodexBar) | `7447bc7` | Swift quota adapters, reset windows, account identity, fallback and stale-source handling |
| [ccusage](https://github.com/ccusage/ccusage) | `0c1bdd1` | Rust adapters in inspected checkout, cross-session deduplication and report accounting |

Tokscale is a candidate for Rust reuse, not a confirmed production dependency. CodexBar is a behavioral reference, not a direct Rust library. Compare implementation differences against source evidence; agreement between tools alone is not proof of correctness.

Inspected root/application licenses were MIT. Check the relevant crate/subtree and transitive licenses before importing code, and retain required notices. Research clones lived in a temporary directory and are not part of this repo.

## Official integration references

- [Codex advanced configuration / telemetry](https://learn.chatgpt.com/docs/config-file/config-advanced)
- [Claude Code monitoring](https://code.claude.com/docs/en/monitoring-usage)
- [Gemini CLI telemetry](https://geminicli.com/docs/cli/telemetry/)
- [Antigravity status line](https://antigravity.google/docs/cli/statusline/)
- [Antigravity hooks](https://antigravity.google/docs/hooks/)

Capabilities and formats are version-dependent. Verify the installed versions before implementation. Token history support does not establish live quota or approval-state support.

## Art references

- [National Palace Museum: Whereto Paradise](https://www.npm.edu.tw/Exhibition-Content.aspx?l=2&sno=04010138): immortal mountain/island landscapes, clouds, palaces and grotto abodes.
- [UNESCO: Wudang architecture](https://whc.unesco.org/en/list/705): architecture in mountain terrain.
- [Ropuka's Idle Island](https://store.steampowered.com/app/3416070/Ropukas_Idle_Island/): desktop diorama format.
- [Rusty's Retirement](https://store.steampowered.com/app/2666510/Rustys_Retirement/): peripheral desktop activity.
- [Tiny Glade](https://store.steampowered.com/app/2198150/Tiny_Glade/): environmental finish and lighting.
- [Amazing Cultivation Simulator](https://store.steampowered.com/app/955900/Amazing_Cultivation_Simulator/): sect/disciples management reference.

No third-party game art is bundled. The spirit-stone icon is an original generated preview asset with provenance retained alongside the prototype.
