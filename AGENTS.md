# CloudSect

Read `docs/design.md` and its linked current specification/plan before implementation. All production desktop code belongs in `application/`. `docs/prototype/` is a disposable design reference, not the production architecture or a live telemetry implementation.

## Models stay plain data

Models, entities and DTOs hold fields, serialization tags and trivial accessors only. Business rules, validation flows, transitions, token calculations and spirit-stone conversion belong in services/use cases/handlers, not model methods.

## Meaningful tests, top-down

Test behavior from the highest owning entry point: handler, use case or service. Cover rules, branches, edge cases, errors and component interactions. Helpers, mappers, models and repository wrappers are normally covered transitively.

Add a lower-level test only for substantial logic that cannot reasonably be reached from above, such as a complex pure algorithm. Never test only constant spellings, exact error strings, constructors copying inputs, plain model creation or serialization without behavior.

## Product boundaries

- Preserve each provider's official CLI/harness. Do not build a replacement agent loop.
- A user-defined agent owns an island via `islandId`; each session has nullable `agentId`. CLI/source identity is independent. Never group or assign islands by AI provider. Task areas are subdivisions of the assigned agent's island.
- Hide, observe and stop are distinct operations. Do not infer authorization to terminate a CLI from a UI hide/close action.
- Missing quota is unknown, not zero. Process existence alone does not establish active work, idle or pending approval.
- Normalize token semantics per provider; cached input and reasoning can overlap their parent categories. Preserve provenance and deduplicate before aggregation or awards.
- Synthetic fixture data and illustrative conversion rules must remain labeled. Do not present the prototype as real telemetry.
- Raw input/output upload and cross-agent review remain TODO until explicitly implemented within scope.
- Do not copy auth credentials, personal transcripts or local account files into the repository.
