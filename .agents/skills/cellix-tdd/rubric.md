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
| `public_contract_only_tests` | 4 | yes | Tests exercise only exported package entrypoints or allowed public subpaths. No deep imports, `internal/` imports, or file-structure coupling. |
| `documentation_alignment` | 4 | yes | `manifest.md` exists with the required sections, `README.md` is consumer-facing, and the README/manifest reflect the public contract. |
| `public_export_tsdoc` | 3 | yes | Meaningful public exports exposed by the package entrypoints have useful TSDoc. |
| `contract_surface` | 2 | yes | The package does not publish obvious internal or helper-only exports. |
| `release_hardening_notes` | 2 | yes | Release notes discuss export review, semver or compatibility impact, and remaining publish/readiness risks. |
| `validation_summary` | 2 | yes | The summary records what was validated and the result, including commands or equivalent concrete evidence. |

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
- README content is not framed as maintainer-only notes
- The manifest or README acknowledges at least one public export or public concept from the package

## Notes on Heuristics

The evaluator uses heuristics rather than a full compiler:

- "Useful TSDoc" means a public export has a preceding `/** ... */` block
- "Consumer-facing README" means the README includes usage/example language and avoids obvious maintainer-only framing
- "Release hardening" means the notes mention compatibility or semver, export surface review, and remaining risk or follow-up

The rubric is strict on contract visibility and intentionally conservative on internal exposure.
