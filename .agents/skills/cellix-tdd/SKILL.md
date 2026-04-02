---
name: cellix-tdd
description: >
  Consumer-first, TDD-driven development for @cellix/* framework packages. Use when:
  (1) adding or changing public behavior in an existing @cellix package,
  (2) refactoring internals while preserving public contracts,
  (3) starting a new @cellix package,
  (4) aligning manifest.md, README.md, and TSDoc with a package's public surface.
license: MIT
compatibility: Works with CellixJS @cellix/* packages in this monorepo
metadata:
  author: CellixJS Team
  version: "1.0"
  repository: https://github.com/CellixJs/cellixjs
allowed-tools: Bash(node:*) Bash(pnpm:*) Read Write Edit Glob Grep
---

# Cellix TDD

Use this skill to evolve `@cellix/*` packages as public products, not as ad hoc internal modules.

The governing loop is:

consumer usage discovery -> package intent alignment -> contract gate -> public contract definition -> failing tests against public APIs only -> implementation/refactor -> documentation alignment -> release hardening -> validation

TDD is central. Expected behavior must be clarified before implementation, public-contract tests should be written before implementation when behavior changes, and refactors must preserve contract tests unless the public contract is intentionally changed.

## When to Use This Skill

- Adding a feature to an existing `@cellix/*` package
- Refactoring internals while keeping the package contract stable
- Creating a new `@cellix/*` package from scratch
- Narrowing an overbroad package surface before release
- Repairing drift between `manifest.md`, `README.md`, TSDoc, and the shipped API

## Core Rules

- Start by inspecting the existing package and repo context. Do not begin with implementation.
- Treat the package as something external consumers will discover, install, and depend on.
- If expected behavior, consumer usage, or package boundaries are materially unclear, collaborate with the user before writing tests or code.
- Maintain `manifest.md` for maintainers. Create it if missing.
- Keep `README.md` consumer-facing. Do not turn it into maintainer design notes.
- Document meaningful public exports with useful TSDoc at the point of export.
- Verify behavior through documented public APIs only.
- Do not deep-import internals from tests.
- Any public behavior or export change requires documentation alignment.
- Leave an explicit validation summary.

## Discovery First

Before changing anything, inspect:

- `package.json` and the package entrypoints/exports
- `manifest.md`, `README.md`, and public-export TSDoc
- existing tests and how they import the package
- current consumers, examples, and neighboring `@cellix/*` packages
- current boundaries, non-goals, and suspicious exports that leak internals

If the package has downstream dependents within the monorepo, identify them now where feasible:

```bash
rg -n 'from "@cellix/<package-name>"' packages/ apps/
```

List each dependent and, where feasible, the specific exports it consumes. This becomes the downstream impact list. Any proposed removal, rename, or behavioral incompatibility that would break a dependent is a breaking change and should be flagged in the Contract gate summary for human review before proceeding.

Capture:

- who the consumers are
- what they are trying to do
- the most important success paths
- failure and edge cases that shape the public contract
- what should stay internal
- what must remain out of scope

If any of those are unclear enough to change the contract guesswork, stop and collaborate with the user before authoring tests.

## Required Workflow

### 1. Package Framing

- Identify the target package and whether it already exists.
- Summarize the package purpose, intended consumers, and non-goals.
- Confirm whether the task is a feature, refactor, greenfield package, docs alignment effort, or API-surface reduction.
- Ensure `manifest.md` exists and reflects the package purpose before planning tests.
- Use [references/package-manifest-template.md](references/package-manifest-template.md) when creating or repairing `manifest.md`.

### 2. Consumer Usage Exploration

- Derive one or more realistic consumer flows before defining the contract.
- Prefer concrete usage snippets over abstract design language.
- Identify failure modes and invariants that consumers should rely on.
- Call out package boundaries and anything that must remain internal.

### 3. Contract Gate

- Always record a `Contract gate summary` before defining the final public contract.
- Human review is required before proceeding when the package is new, `manifest.md` is missing, exports are being removed or renamed, behavior is changing materially, downstream dependents would break, or you are uncertain about the surface.
- Surface the proposed public exports as a bullet list with a one-sentence purpose for each, include the most important consumer usage snippet, and flag any uncertain exports explicitly.
- For clearly additive, low-risk changes to an established contract, record the proposed surface in the summary and proceed unless the user requests review.

### 4. Public Contract Definition

- Define the intended public exports and the observable behavior attached to each export.
- Prefer cohesive, minimal APIs. For each proposed export, you must be able to answer both of these questions:
  1. What specific consumer need does this export serve?
  2. Why does this need to be public rather than internal?
- If you cannot answer both questions for an export, it should not be in the public surface. Flag it as a candidate for removal and note it in the Contract gate summary for human review.
- Remove or avoid exports that expose helpers, file structure, or implementation details.
- Clarify semver impact when the contract changes. Do not justify breaking changes solely because the package is pre-1.0. Removals, renames, behavioral incompatibilities, and contract narrowing are breaking and must be explicitly reviewed. Additive compatible changes may still be non-breaking, but evaluate them conservatively because they establish the baseline external consumers will learn.

### 5. Test Plan

- Write or preserve tests against package entrypoints only.
- Add failing tests before implementation when public behavior is being added or changed.
- For refactors, keep or strengthen public-contract tests before moving internals.
- Cover success paths, important failures, and edge cases from the consumer flows.
- Reject tests that import from `internal`, deep `src/` paths, or private helpers.

### 6. Implementation and Refactor

- Let implementation emerge from the contract tests.
- Refactor toward clarity only after the contract is captured in tests.
- Keep internals internal. Do not widen exports to make tests easier.

### 7. Documentation Alignment

- Keep `manifest.md`, `README.md`, and TSDoc aligned with the resulting contract.
- `manifest.md` is for maintainers and package boundaries.
- `README.md` is for consumers, usage, concepts, and caveats.
- TSDoc belongs on meaningful public exports and should cover purpose, parameters, returns, errors, side effects, and examples where useful.
- Use [references/package-docs-model.md](references/package-docs-model.md) when deciding what belongs in each documentation layer.

### 8. Release Hardening

- If the package has downstream dependents, verify the final export surface against the downstream impact list captured during discovery. Any dependent that would break must be called out explicitly in Release hardening notes with a migration plan before the package is treated as release-ready.
- Review the final export surface for leaks or accidental breadth.
- Note semver impact, upgrade risk, and whether behavior is backward compatible.
- Call out packaging or publish-readiness concerns that still block external release.
- Record any follow-up work that should happen before the package is treated as release-ready.

### 9. Validation

- Run the smallest useful validation set that proves the contract and docs alignment.
- Prefer targeted package tests first, then wider verification if the change justifies it.
- Summarize exactly what was run and what passed or remains unverified.
- When useful, score the resulting artifacts with [evaluator/evaluate-cellix-tdd.ts](evaluator/evaluate-cellix-tdd.ts).
- A passing evaluator score confirms that the observable artifacts, such as tests, docs, and export-surface notes, meet the rubric heuristics. It does not confirm that the public contract is correct, complete, or ready for npm publication.
- Do not represent a passing evaluator score as release readiness. Human review of the public contract is still required before any package version is published.

## Required Output Structure

When using this skill, structure the final work summary with these exact section headings:

- `Package framing`
- `Consumer usage exploration`
- `Contract gate summary`
- `Public contract`
- `Test plan`
- `Changes made`
- `Documentation updates`
- `Release hardening notes`
- `Validation performed`

Each section should describe observable decisions and artifacts, not generic process narration.

## Validation Expectations

The work is not done until you can explain:

- what public contract was validated
- which tests were added or preserved before implementation
- how docs were aligned
- whether the export surface is appropriately narrow
- what release risks or follow-ups remain

For skill-harness evaluation, run:

```bash
pnpm run test:skill:cellix-tdd
```

For real package work, use:

```bash
pnpm run skill:cellix-tdd:check -- --package packages/cellix/my-package
```

Important: a passing evaluator score confirms that observable artifacts such as tests, docs, and export-surface notes meet the rubric heuristics. It does not confirm that the public contract is correct, complete, or ready for npm publication. Human review of the public contract is still required before any package version is published.

This creates the scaffold if it is missing and then evaluates the package against the summary.

The generated file is a scaffold. It is expected to fail evaluation until the placeholder sections are replaced with package-specific content.

Useful options:

- `--output /path/to/summary.md` to override the default summary path
- `--init-only` to create or refresh the scaffold without evaluating
- `--force-init` to overwrite an existing scaffold before continuing
- `--json` for machine-readable evaluation output

## Anti-Patterns

- Writing implementation before clarifying consumer usage
- Treating tests as a post-implementation confirmation step
- Importing internals or deep source files from tests
- Expanding exports to make testing easier
- Leaving public exports undocumented
- Letting `README.md` drift into maintainer-only rationale
- Claiming release readiness without validation evidence
- Proceeding to Public Contract Definition without surfacing the proposed surface when the task warrants human review
- Adding an export because it makes a test easier to write rather than because a consumer needs it
- Treating a passing evaluator score as approval to publish; the evaluator checks artifacts, not contract correctness

## Copilot Agent Notes

These notes apply to GitHub Copilot CLI agents running this skill.

### Collaboration and clarification

Use the `ask_user` tool when package boundaries, intended consumers, or key behavioral decisions are materially unclear before writing tests or code. Also use it when the contract gate is triggered for a new package, a breaking or behaviorally material surface change, or a dependent-impacting export change. Do not skip the collaboration step when it is warranted; address ambiguity up front so the contract reflects actual requirements rather than guesswork.

### Discovery phase

Use the `task` tool with `agent_type: "explore"` to inspect the existing package and codebase before writing any code. Batch all discovery questions into a single call — ask for the public API shape, existing test patterns, README and manifest state, and any neighboring `@cellix/*` packages that may be relevant, all at once. The explore agent is stateless and loses all context between calls, so avoid sequential discovery calls.

To find existing consumers of a package within the monorepo, search for workspace imports: `rg -n 'from "@cellix/package-name"' packages/ apps/`. This tells you what the package's real dependents are and what they actually use, which is the most grounded starting point for consumer usage exploration. If that search shows dependents for exports you plan to remove, rename, or narrow, treat that as an automatic contract-gate trigger.

### Running tests and builds

Use the `task` tool with `agent_type: "task"` to run package-scoped test commands. Prefer targeted commands (`pnpm --filter <package> test`) over full-workspace runs unless the change justifies wider verification.

### Iterative evaluation

After producing the required output sections, run the evaluator to check your artifacts:

```bash
pnpm run skill:cellix-tdd:check -- --package <package-path>
```

Read the output, address any failed checks, and re-run. The evaluator uses heuristics — treat its output as a checklist to verify your work, not as a final verdict. A passing score confirms the observable artifacts meet the rubric; it does not replace your own judgment about contract quality.

It also does not authorize publication; human review of the contract is still required before release.

## References

- [rubric.md](rubric.md) for evaluation criteria
- [references/package-docs-model.md](references/package-docs-model.md) for documentation-layer responsibilities
- [references/package-manifest-template.md](references/package-manifest-template.md) for `manifest.md`
- [fixtures/README.md](fixtures/README.md) for the included fixture suite
