# Interactive design reference

This is the last approved direction from the design conversation, branded CloudSect for this repository. It is a disposable single-file browser prototype, not the production Tauri application.

Run from the repository root:

```sh
python3 -m http.server 8090 --bind 127.0.0.1 --directory docs/prototype
```

Open [the preview](http://localhost:8090).

## What it demonstrates

- Wide-screen scene with a mountain for each provider/elder and session disciples on that mountain.
- Peak focus, camera orbit/zoom, session detail, robe colors, rename and task-district preferences.
- Day/night, Vietnamese/English, motion pause and compact-view simulation.
- Synthetic token/time accounting, provider filter, session register and spirit-stone display.

Names and display areas persist in browser local storage under `linhcac.demo.disciples.v2`, retained from the original reference. Storage is scoped to browser origin. The live application must choose its own durable identity and persistence schema.

## What it does not demonstrate

No CLI integration, real quota, real awards, backend, native macOS window behavior or production asset pipeline. The 1,000-token conversion rate is illustrative and remains undecided. Character motion is procedural, not a rigged animation system.

## Files

- `index.html`: scene and UI reference, rebased to relative asset paths.
- `vendor/`: pinned Three.js 0.180.0 modules and MIT license.
- `assets/spirit-stone.png`: generated original jade icon; generation provenance is retained in the neighboring JSON file.

Rebuild the real app with separate scene, UI, services and plain data models. Do not treat the prototype's global state or inlined fixture calculations as the target architecture.

## Ownership correction

The current specification supersedes provider-owned mountains in this reference. Production islands belong to named agents (`agent.islandId`); sessions have nullable `agentId`, independent of CLI source. Keep this prototype as visual reference, not the data model.
