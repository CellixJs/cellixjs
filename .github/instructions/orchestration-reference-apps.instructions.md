---
applyTo: "apps/**/*"
description: Orchestration routing rules for application and reference-app paths.
---

# Reference App Orchestration

- Treat `apps/**/*` as application work by default, except for `apps/docs/**/*`, which belongs to the docs lane.
- Use `application-feature-delivery` for product and reference-app delivery.
- Use `tooling-workflow` if the change is primarily local dev plumbing or validation wiring inside an app.
- Do not enable `cellix-tdd` from app paths unless the orchestrator explicitly reroutes the task into reusable framework work.
