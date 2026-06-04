# @cellix/local-dev

Shared local-development runtime for Cellix application packages.

This package replaces duplicated `start-dev.*`, `start-mongo.*`, `start-azurite.*`, and root `scripts/local-dev/*` orchestration with one reusable package plus a small CLI.

## What this package provides

- Worktree-aware portless hostname derivation
- Worktree-aware MongoDB and Azurite port derivation
- API local-settings sync for normal and `e2e` modes
- Shared dev runners for:
  - Vite apps
  - Docusaurus docs
  - Azure Functions local startup
  - TSX-backed mock servers
  - Azurite

## Install

In this monorepo, app packages consume the workspace package directly:

```json
{
	"devDependencies": {
		"@cellix/local-dev": "workspace:*"
	}
}
```

## CLI usage

```bash
cellix-local-dev vite --profile ui-community
cellix-local-dev vite --profile ui-staff
cellix-local-dev docusaurus
cellix-local-dev azure-functions
cellix-local-dev tsx --profile oauth2-mock
cellix-local-dev tsx --profile mongo-memory-mock
cellix-local-dev azurite
cellix-local-dev sync-api-local-settings
cellix-local-dev sync-api-local-settings e2e
```

## Example app scripts

```json
{
	"scripts": {
		"dev": "pnpm exec portless ownercommunity.localhost --force cellix-local-dev vite --profile ui-community",
		"dev:worktree": "pnpm exec portless ownercommunity.${WORKTREE_NAME}.localhost --force cellix-local-dev vite --profile ui-community"
	}
}
```

```json
{
	"scripts": {
		"sync-local-settings": "cellix-local-dev sync-api-local-settings",
		"dev": "pnpm exec portless data-access.ownercommunity.localhost --force cellix-local-dev azure-functions",
		"azurite": "cellix-local-dev azurite"
	}
}
```

## Public API

The package also exports the local-dev primitives for tests or scripted composition:

- `resolveWorkspaceRoot`
- `resolvePortlessHostnames`
- `buildPortlessUrl`
- `buildViteArgs`
- `getWorktreePortOffset`
- `getMongoPort`
- `getAzuritePorts`
- `getAzuriteConnectionString`
- `getMongoConnectionString`
- `syncApiLocalSettings`
- `runViteDev`
- `runDocusaurusDev`
- `runAzureFunctionsDev`
- `runTsxDev`
- `runAzuriteDev`

## Notes

- The implementation is in TypeScript, but the package exposes a normal Node bin so consuming app scripts do not need to boot shared `.ts` files through `tsx`.
- The package derives the workspace root from the caller's current working directory, so app packages do not need to hardcode repo-relative paths.
