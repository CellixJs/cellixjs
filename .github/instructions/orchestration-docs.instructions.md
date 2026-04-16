---
applyTo: "apps/docs/**/*"
description: Orchestration routing rules for contributor and architecture documentation.
---

# Docs and Architecture Orchestration

- Treat `apps/docs/**/*` as the `docs` path class.
- Default documentation and ADR changes to the `docs-architecture-planning` lane.
- Keep architecture docs aligned with the machine-readable orchestration model and the repo-local orchestration spec.
- If a docs task also changes executable tooling, keep one primary lane and record the secondary impact explicitly.
