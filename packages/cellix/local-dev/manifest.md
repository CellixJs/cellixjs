# manifest.md - @cellix/local-dev

## Purpose

Provide generic local-development primitives for Cellix app packages so app-owned wrapper scripts can supply project-specific env keys, hostnames, and local-settings policy without hardcoding those details into the shared package.

## Scope

This package owns generic worktree-aware port math, URL helpers, dotenv and JSON file utilities, child-process lifecycle handling, worktree settings transforms, and generic dev-runner orchestration for Vite, Docusaurus, Azure Functions, Node-backed processes, and Azurite.

## Non-goals

- Production runtime behavior
- App-specific env-variable names, hostnames, auth-provider paths, or local-settings keys
- Discovering repo-specific app folders from inside the package
- Replacing app-owned wrapper scripts that express local project policy

## Public API shape

Published entrypoints:

- `@cellix/local-dev`
- `@cellix/local-dev/files`
- `@cellix/local-dev/process`
- `@cellix/local-dev/runners`
- `@cellix/local-dev/urls`
- `@cellix/local-dev/vite`
- `@cellix/local-dev/workspace`
- `@cellix/local-dev/worktree`

Root entrypoint exports:

- `resolveWorkspaceRoot(options?)`
- `readDotEnv(filePath)`
- `readJsonFile(filePath)`, `writeJsonFile(filePath, data)`, `syncJsonFile(options)`
- `hostnameFromUrl(url)`, `sanitizeWorktreeHostnameLabel(worktreeName)`, `applyWorktreeSuffix(hostname, worktreeName)`, `buildPortlessUrl(hostname, path?)`, `replaceUrlPort(url, port)`, `PORTLESS_PORT`
- `isE2E(env?)`, `buildViteArgs(options?)`
- `isGracefulInterruptExit(signal, code)`, `forwardChildExit(child)`
- `getWorktreePortOffset(worktreeName?)`, `getMongoPort(worktreeName?)`, `getAzuritePorts(worktreeName?)`, `buildAzuriteConnectionString(options)`
- `ViteDevRunner`, `DocusaurusDevRunner`, `AzureFunctionsDevRunner`, `NodeDevRunner`, `AzuriteDevRunner`
- `WorktreeSettings`, `AzureFunctionsLocalSettings`, `resolveAzureFunctionsLocalSettingsValues`, `convertSettingsForWorktree`, `WorktreeConversionPlan`, `WorktreeMode`
- `runViteDev(options?)`, `runDocusaurusDev(options?)`, `runAzureFunctionsDev(options?)`, `runNodeDev(options?)`, `runAzuriteDev(options)`
- `runTsxDev(options?)` remains as a deprecated compatibility alias for `runNodeDev(options?)`

## Core concepts

- App packages own local-development policy such as env-variable names, URL mappings, auth-provider routes, and which settings values are passed into the worktree transformer.
- This package should expose only reusable mechanics that make those wrappers smaller and more consistent.
- Worktree isolation is deterministic and should keep MongoDB ports, Azurite ports, hostname suffixing, URL-like env values, and JSON settings aligned across all participating apps.
- Worktree transforms are auto-detected from `WORKTREE_NAME`; callers can still override that decision programmatically with `worktree` when needed. Generic settings transforms apply only to complete URL-valued strings, while explicit key-level policy belongs in `convertSettingsForWorktree`.
- Azure Functions dev runners may prepare `local.settings.json` before startup because the Functions host reads settings from its script root rather than the process environment alone.
- Consumers that need the same Azure Functions values outside `func start` can resolve them without writing a file; regular mode remains unscoped unless a worktree name is explicitly available.
- Hostname suffixing must sanitize raw worktree names before inserting them into `.localhost` domains, and repeated suffixing with the same worktree label must leave hostnames unchanged.

## Package boundaries

- Do not encode OCOM app names, auth paths, env-variable names, or `local.settings.json` schemas in this package.
- Keep repo-specific hostname and env mapping logic in app-owned scripts or internal repo helpers outside this package.
- Avoid widening the public surface with one-off helpers that only exist to support a single app branch.

## Dependencies / relationships

- Downstream consumers in this monorepo: `@apps/api`, `@apps/docs`, `@apps/ui-community`, `@apps/ui-staff`, `@apps/server-oauth2-mock`, `@apps/server-mongodb-memory-mock`
- Consumed from app-owned wrapper scripts and from tests through the TypeScript API

## Testing strategy

- Prefer public-entrypoint tests for dotenv parsing, URL helpers, worktree port derivation, runner object spawning, Vite arg building, Azurite connection-string building, worktree settings transforms, and generic JSON syncing.
- Avoid tests that prove repo-specific wrapper policy through this package's public contract.

## Documentation obligations

- Keep `README.md` focused on the generic helper surface and how app-owned wrappers compose it.
- Keep TSDoc aligned on public exports that define package behavior.
- Update this manifest when public exports or scope boundaries change.

## Release-readiness standards

- App packages should be able to express their policy without modifying this package.
- Package build and package tests must pass, plus affected app builds/tests as justified by the migration.
- New helper exports must solve a reusable mechanical problem rather than expose app policy.
