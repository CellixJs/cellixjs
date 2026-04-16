# Cellix TDD Rubric

The evaluator scores artifact quality against the checks below. It is intentionally artifact-first: it looks at the package contents, the public tests, and the skill summary output instead of trusting claims.

## Scoring

- Total available score: `20`
- Passing score: `16`
- Any failed critical check is an overall fail even if the score threshold is met

## Checks

| Check ID | Weight | Critical | Pass Condition |
| --- | ---: | :---: | --- |
| `required_workflow_sections` | 3 | yes | The skill summary contains all required output sections with non-trivial content. |
| `public_contract_only_tests` | 4 | yes | Tests exercise only exported package entrypoints or allowed public subpaths, the export under test is obvious from the suite structure, and duplicate lower-level coverage is avoided or explicitly justified. |
| `documentation_alignment` | 4 | yes | `manifest.md` exists with the required sections, `README.md` is consumer-facing as a standalone package guide, and the README/manifest reflect the public contract. |
| `public_export_tsdoc` | 3 | yes | Meaningful public exports exposed by the package entrypoints have rich TSDoc with signature context and examples where relevant. |
| `contract_surface` | 2 | yes | The package does not publish obvious internal or helper-only exports. |
| `release_hardening_notes` | 2 | yes | Release notes discuss export review, semver or compatibility impact, and remaining publish/readiness risks. |
| `validation_summary` | 2 | yes | The summary records package build and existing test verification, plus outcomes and any wider checks, with commands or equivalent concrete evidence. |

## Documentation Alignment Details

`documentation_alignment` expects all of the following:

- `manifest.md` contains:
  - `Purpose`
  - `Scope`
  - `Non-goals`
  - `Public API shape`
  - `Core concepts`
  - `Package boundaries`
  - `Dependencies / relationships`
  - `Testing strategy`
  - `Documentation obligations`
  - `Release-readiness standards`
- `README.md` explains the package for consumers and includes usage or example material
- `README.md` frames install and usage guidance as standalone package consumption rather than workspace-only setup
- README content is not framed as maintainer-only notes
- README content avoids repo-local app references such as `@apps/*`
- The manifest or README acknowledges at least one public export or public concept from the package

## Notes on Heuristics

The evaluator uses heuristics rather than a full compiler:

- "Useful TSDoc" means a public export has a preceding `/** ... */` block with substantive content; function-like exports should include signature tags and an example
- "Consumer-facing README" means the README includes usage/example language, avoids obvious maintainer-only framing, and does not read like a workspace-only setup note
- "Public-contract-first testing" means consumer-visible behavior is primarily verified through package entrypoints; avoid adding narrower tests that merely restate the same behavior unless there is a clear gap the contract suite cannot express cleanly
- "Release hardening" means the notes mention compatibility or semver, export surface review, and remaining risk or follow-up
- "Validation performed" means the summary names both build and test verification and states the outcome; wider workspace checks should be called out when they were run or intentionally deferred

The rubric is strict on contract visibility and intentionally conservative on internal exposure. Semantic duplicate-test detection is only heuristic, so the workflow and summary still carry the primary burden for explaining why any narrower tests remain.
