# Meditating Chibi Disciples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace each upright primitive session figure with a readable, meditating 3D chibi while keeping the sect scene interactive and smooth.

**Architecture:** Extend the existing Three.js scene factory with a small shared geometry/material kit, then compose each session character from those shared pieces using its agent robe color. Reuse the current lifecycle loop for a tiny working-session breath and preserve recursive ray-picking metadata.

**Tech Stack:** Three.js 0.180, TypeScript, Vite/Tauri desktop application.

**Spec:** `docs/superpowers/specs/2026-11-12-meditating-chibi-design.md`

## Global Constraints

- All production desktop code stays in `application/`.
- Use the existing Three.js scene and shared geometry/material registries; add no model asset, loader, or rendering dependency.
- Preserve session selection, status, nameplate, agent robe color, and island ownership.
- Keep the current adaptive renderer, lifecycle behavior, and cap of 24 visible disciples.
- Do not add detail whose visual cost or screen density makes the scene harder to read.
- No backend, telemetry, or task semantics changes.

## Review Focus

- Clicking the new face, robe, or hands must still select the owning session; verify each hit through the live inspector.
- At the wide overview, crossed legs and resting hands must read as meditation; inspect the scene at normal and compact sizes.
- Distinct agent robe colors and the status dot must stay legible in both light and dark themes; inspect both themes with working and idle samples.
- Hidden or reduced-motion lifecycle states must stop continuous animation; toggle visibility/motion and confirm rendering settles.
- Repeated figures must reuse geometry/material resources and remain within the existing 24-character cap; inspect the render with the largest available fixture and low quality.

---

### Task 1: Build and verify shared meditating chibi figures

**Files:**
- Modify: `application/src/scene/runtime/create-sect-scene.ts`

**Interfaces:**
- Consumes: existing `SceneProjection` disciples/agents and `SceneLifecycle`, current `createDisciple` placement, selection ray targets, and animation loop.
- Produces: the same `SectScene` API and session selection behavior; each visible disciple has a seated meditation silhouette and reusable scene resources.

- [x] Extend the shared geometry/material registries for a compact seated silhouette: crossed robe base, short torso and sleeves, resting hands, oversized warm face with closed eyes, dark hair cap/topknot, and a small status marker. Keep the design in jade/cream/ink tones while taking the main robe color from the owning agent.
- [x] Recompose `createDisciple` from those shared pieces. Preserve the existing nameplate and status; attach `sessionId` and `islandId` metadata to all recursively raycastable character parts so clicking the face or robe still selects the right session.
- [x] Replace the upright whole-figure bob with a very small breathing scale on the upper-body group for working sessions. Reuse existing objects and update them in place; do not allocate geometry, materials, or vectors in the render loop. Leave idle figures still and respect the existing `motion`/`active` lifecycle.
- [x] Open the running app and inspect wide overview plus compact mode in light/dark themes. Click face, robe, hands, and status marker to confirm the correct session opens; compare working and idle poses; inspect the largest available fixture and low-quality mode for clipping, label overlap, and visible slowdown. The live fixture had 7 sessions; the 24-character limit was reviewed statically, not measured as a max-load GPU run.
- [x] Run `npm run typecheck`, `npm run lint`, and `npm run build` from `application/`; all passed.

## Validation note

The application currently has no test script or existing test files. This is a visual scene-composition change, so a unit test of geometry counts or coordinates would mirror implementation details rather than verify user behavior. The user approved using live scene interaction/performance checks plus existing compile/lint/build checks instead of adding test dependencies.

## Self-review

- Spec coverage: mesh approach, seated meditation pose, robe palette, session selection, restrained motion, lifecycle support, shared resources, and the 24-disciple cap are all covered in Task 1.
- Review focus maps each likely failure to a named live-scene check; no model, backend, or accounting behavior is in scope.
- Scope is one runtime file and one independently reviewable task; no refactor or new dependency is needed.
- Independent source review found no Critical, Important, or Minor defects. It verified geometry compatibility, shared resources, selection metadata, lifecycle gating, and cleanup. Maximum 24-disciple GPU performance remains unmeasured.
