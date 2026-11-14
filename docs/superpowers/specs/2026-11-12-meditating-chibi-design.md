# Meditating Chibi Disciples — Design

## Intent

Replace the current upright, primitive session figures with charming 3D chibi cultivators visibly meditating on their assigned islands. The world should feel more alive and characterful while staying smooth on a desktop Mac.

## Goals

- Give each disciple a clear seated meditation silhouette: oversized head, compact robe, crossed-leg base, hands together in the lap, simple readable face and topknot.
- Keep each agent's robe color and each session's status, nameplate, selection, and island ownership visible and interactive.
- Use shared Three.js geometry and materials across sessions; preserve the current adaptive frame-rate, pixel-ratio, visibility, and character-count limits.
- Restrict idle motion; use a subtle breathing motion for working sessions and honor reduced-motion/lifecycle settings.

## Non-goals and anti-goals

- No external model download, GLB loader, sprite character, new rendering engine, or shadow/particle effects.
- No changes to telemetry, session semantics, or backend behavior.
- Avoid extra draw calls, per-frame object/material creation, noisy animation, or detail too small to read at the current camera distance.

## Approaches

- Shared procedural 3D meshes: chosen. This fits the existing Three.js scene, retains depth and ray-picking, and makes repeated characters inexpensive; the shape detail must stay stylized and deliberate.
- Reused GLB model: can provide richer authored detail, but adds a model asset and animation/loading pipeline.
- 2D billboard: lowest rendering cost, but loses the volume and angle consistency of the existing island scene.

## Constraints and implementation direction

Build on `application/src/scene/runtime/create-sect-scene.ts`. Compose the disciple from a small set of reusable meshes/materials, with only palette/status differences per instance. Preserve session ID and island ID metadata on selectable parts so the current inspector interaction continues to work. Keep animation proportional to the existing scene lifecycle and ensure inactive/compact/reduced-motion states do not gain continuous work.

## Acceptance

At the current wide home-scene camera, a disciple reads as seated and meditating rather than standing; agent robe colors and status remain legible; selecting its body still opens the correct session; and the scene keeps its existing adaptive performance behavior with the supported visible character cap.
