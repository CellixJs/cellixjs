---
applyTo: "build-pipeline/**/*"
description: Orchestration guidance for validation, CI, and build-pipeline assets.
---

# Build Pipeline Orchestration

- Treat `build-pipeline/**/*` as the `tooling` path class.
- Default build-pipeline work to the `tooling-workflow` lane.
- Validation, CI, and hook logic should enforce the orchestration control plane rather than invent policy that bypasses the spec, ADRs, or instruction layers.
- Keep validation outputs concise and actionable so the orchestrator can recover cleanly from denials or failures.
