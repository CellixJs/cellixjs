---
name: cellix-framework-surface-review
description: Reusable-framework public-surface review for Cellix orchestration. Use when reviewing public contract changes or public-surface risk in reusable framework packages, and route to cellix-tdd when framework contract development is required.
---

# Cellix Framework Surface Review

Use this skill for reusable framework scrutiny, especially in the `reusable-framework-public-surface` lane.

## Scope

Review:

- public exports
- consumer-visible behavior
- README and manifest alignment
- public TSDoc quality
- public-contract tests
- release-risk posture for reusable framework packages

## Workflow

1. Confirm the active profile supports reusable framework behavior.
2. Confirm the lane is reusable framework work.
3. Inspect the changed public surface, adjacent consumer tests, and package docs.
4. If the work is true framework contract development, hand off to `cellix-tdd` for the contract-first workflow.
5. Return review findings or approval focused on public-surface integrity.

## Guardrails

- Do not use this skill in `application-only` repositories.
- Do not apply reusable framework contract rules to application packages.
- Prefer one public-surface review pass per bounded phase instead of duplicating ordinary QA review.
- If no public surface actually changed, return that finding clearly and drop back to standard review.

## Output Contract

Return:

- whether public surface changed
- whether `cellix-tdd` is required
- findings on exports, docs, tests, or release risk
- approval or revision recommendation
