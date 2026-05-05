Azure DevOps monorepo pipeline notes

This short note documents the current execution model for the monorepo deployment stage and the rationale behind keeping per-application change flags emitted by detect-changes.cjs.

Execution model

- Current templates run API and UI Community templates in parallel by default to reduce total pipeline run time.
- UI Staff currently depends on UI Community (see build-pipeline/core/monorepo-deployment-stage.yml and apps/ui-staff/deploy-ui-staff.yml).
- Documentation that previously described a fully serialized infra deployment (API -> UI Community -> UI Staff -> Docs) was written before a refactor; the repository currently prefers the parallel model described above.

Why per-app detect-changes flags remain

- The detect-changes.cjs script still emits per-application flags (e.g. HAS_FRONTEND_COMMUNITY_CHANGES / HAS_FRONTEND_STAFF_CHANGES) and places them in the pipeline run variables.
- These flags are retained intentionally for possible future use (for example: gating PR deployments, implementing forced-deploy logic, or optimizing production runs).
- The current pipeline intentionally does not gate PR deployments on these flags to keep PR runs deterministic and to avoid surprise failures caused by change-detection drift.

If you want serialized infra deployments

- If the team prefers to restore the original serialized ordering, we recommend opening a small follow-up change that adds explicit dependsOn links in the monorepo deployment stage so jobs run: API -> UI Community -> UI Staff -> Docs. This is a behavior change and should be validated by CI and stakeholders.

Contact

If you have questions about the pipeline intent or want to propose a change to serialization, open an issue or discussion in the repository and tag the DevOps owners.
