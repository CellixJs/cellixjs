# manifest.md - @cellix/local-dev

## Purpose

Provide local developer wrappers for Cellix commands that should be quiet on
success and diagnostic on failure.

## Scope

This branch owns only the silent verification runner surface and portable tool
wrappers. Other local-dev modules from related pull requests will share this
package after the branches are merged.

## Non-goals

- E2E or acceptance test output changes
- Project-specific Snyk, Edgescan, or scanner policy such as org names,
  repository URLs, token handling, or report publishing
- Worktree ports, app dev-server runners, URL transforms, or settings sync

## Public API shape

Published entrypoints:

- `@cellix/local-dev`
- `@cellix/local-dev/silent-runners`

Root entrypoint exports:

- `runSilentCommand(options)`
- `runSilentCommandSequence(options)`
- tool-wrapper builders such as `knipCheck()`, `pnpmAudit(options)`,
  `snykDependencyScan(options)`, `snykCodeScan(options)`, and
  `sonarPullRequestAnalysis(options)`

## Core concepts

- Silent verification runners capture external command output, emit nothing on
  success, and replay whatever the command wrote to stdout/stderr on failure.
- Silent command sequences run ordered verification steps, defaulting each step
  to silent output while allowing explicit passthrough steps for e2e or
  acceptance suites.
- Tool wrappers encode portable CLI shapes; root or app scripts own
  project-specific arguments.
- Commands are spawned without shell interpolation.

## Package boundaries

- Do not encode project-specific Snyk, Edgescan, or scanner policy here.
- Keep this branch scoped to the silent runner module so it can merge cleanly
  with other `@cellix/local-dev` modular exports.

## Dependencies / relationships

- Downstream consumers in this monorepo: the root `verify` script.

## Testing strategy

- Public-entrypoint tests prove success output is suppressed, failure output is
  replayed, and the root verify sequence uses the expected tool wrappers and
  keeps only e2e output live on success.

## Documentation obligations

- Keep README.md consumer-facing and focused on silent runners until the broader
  local-dev package exports merge.
- Keep TSDoc aligned on the public runner API.

## Release-readiness standards

- Package build and package tests must pass.
- Root verification scripts should preserve their existing command arguments.
