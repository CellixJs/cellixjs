---
applyTo: "packages/ocom/**/*"
description: Orchestration routing rules for application packages in the mixed CellixJS repo.
---

# Application Package Orchestration

- Treat `packages/ocom/**/*` as the `applicationPackages` path class unless the orchestration spec says otherwise.
- Default these paths to the `application-feature-delivery` lane.
- Do not activate reusable-framework skills or reviewers for these paths unless the orchestrator explicitly reclassifies the task.
- Preserve existing package-local and domain-specific instructions; the orchestration layer decides phase flow, not domain implementation details.
