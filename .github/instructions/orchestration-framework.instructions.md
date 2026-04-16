---
applyTo: "packages/cellix/**/*"
description: Orchestration routing and review rules for reusable Cellix framework packages.
---

# Reusable Framework Orchestration

- Treat `packages/cellix/**/*` as the `reusableFramework` path class unless the repo-local orchestration spec overrides it.
- Use `reusable-framework-public-surface` when changing exports, public behavior, consumer docs, manifest content, or public-contract tests.
- Use `reusable-framework-internal` for internal refactors and hardening that preserve the existing public contract.
- In profiles that support framework work, `cellix-tdd` is the contract-development skill. Do not apply it to application or tooling paths.
- Public-surface review may require `framework-surface-reviewer` before completion.
