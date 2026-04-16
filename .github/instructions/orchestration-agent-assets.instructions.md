---
applyTo: ".agents/**/*"
description: Orchestration guidance for managed skills, orchestration assets, and agent-support materials.
---

# Agent Asset Orchestration

- Treat `.agents/**/*` as `tooling` work unless the active task is primarily documentation.
- Managed skills must stay discoverable through `.agents/skills/` and matching `.github/skills/` symlinks.
- Keep skill instructions concise and route reusable framework contract work to `cellix-tdd` instead of duplicating it.
- Changes to orchestration assets must follow the shared model from `.agents/orchestration/model/orchestration-model.v1.json`.
