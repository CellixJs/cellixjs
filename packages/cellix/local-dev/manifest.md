# manifest.md - @cellix/local-dev

## Purpose

Provide a single local-development runtime for Cellix app packages so app-level `dev`, `dev:worktree`, `azurite`, and local-settings scripts can stay configuration-shaped while the real orchestration lives in one reusable package.

## Scope

This package owns worktree-aware hostname and port derivation, portless URL building, API local-settings rewriting, child-process lifecycle handling, and the shared dev-runner orchestration for Vite, Docusaurus, Azure Functions, TSX-based mock servers, and Azurite.

## Non-goals

- Production runtime behavior
- Generic process management beyond Cellix local-development use cases
- Replacing app build/start scripts that are not part of the local-development workflow

## Public API shape

- `resolveWorkspaceRoot(options?)`
- `resolvePortlessHostnames(options?)`, `buildPortlessUrl(hostname, path?)`, `PORTLESS_PORT`
- `isE2E(env?)`, `buildViteArgs(options?)`
- `isGracefulInterruptExit(signal, code)`, `forwardChildExit(child)`
- `getWorktreePortOffset(worktreeName?)`, `getMongoPort(worktreeName?)`, `getAzuritePorts(worktreeName?)`
- `getAzuriteConnectionString(options?)`, `getMongoConnectionString(options?)`
- `syncApiLocalSettings(options?)`
- `runViteDev(profile, options?)`, `runDocusaurusDev(options?)`, `runAzureFunctionsDev(options?)`, `runTsxDev(profile, options?)`, `runAzuriteDev(options?)`

## Core concepts

- App packages should express local dev behavior as small parameter choices such as profile names or entry paths, not as duplicated process wiring.
- Worktree isolation is deterministic and should keep hostnames, MongoDB ports, and Azurite ports aligned across all participating apps.
- The package is allowed to know Cellix app profiles such as `ui-community`, `ui-staff`, `oauth2-mock`, and `mongo-memory-mock`, because those profiles are the stable consumer contract that replaces ad hoc app wrapper scripts.

## Package boundaries

- Keep CLI argument parsing, process spawning helpers, file-system helpers, and app profile definitions internal unless consumers outside this package need them directly.
- Do not leak app-relative path assumptions into consumers; the package must derive workspace paths from the caller's current working directory.
- Avoid widening the public surface with one-off helpers that only exist to support a single internal branch.

## Dependencies / relationships

- Downstream consumers in this monorepo: `@apps/api`, `@apps/docs`, `@apps/ui-community`, `@apps/ui-staff`, `@apps/server-oauth2-mock`, `@apps/server-mongodb-memory-mock`
- Consumed from package scripts through the `cellix-local-dev` bin and from tests through the TypeScript API

## Testing strategy

- Prefer public-entrypoint tests for hostname derivation, worktree port derivation, Vite arg building, connection-string patching, and API local-settings rewriting.
- Avoid tests that reach into internal CLI parsing or helper modules when a public function already proves the observable behavior.

## Documentation obligations

- Keep `README.md` focused on how app packages consume the package.
- Keep TSDoc aligned on public exports that define package behavior.
- Update this manifest when app profiles, public exports, or scope boundaries change.

## Release-readiness standards

- App packages should need only profile/entry configuration in `package.json` after consuming this package.
- Package build and package tests must pass, plus affected app builds/tests as justified by the migration.
- Any new app profile should be added deliberately and documented as part of the contract.
