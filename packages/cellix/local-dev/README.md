# @cellix/local-dev

Generic local-development helpers for Cellix app wrappers.

This package is intentionally policy-free. It owns reusable mechanics such as worktree port math, URL helpers, JSON and dotenv utilities, process exit forwarding, and generic dev runners. App-specific env keys, hostnames, auth routes, and `local.settings.json` mutations belong in app-owned wrapper scripts or internal repo helpers, not here.

## Install

In this monorepo, app packages consume the workspace package directly:

```json
{
	"devDependencies": {
		"@cellix/local-dev": "workspace:*"
	}
}
```

## What this package provides

- Workspace-root discovery
- Dotenv parsing and JSON file sync helpers
- Worktree-aware hostname and URL utilities
- Worktree-aware MongoDB and Azurite port derivation
- Azurite connection-string construction from explicit credentials
- Worktree-aware settings transforms for arbitrary env and JSON values
- Generic dev runners for:
  - Vite
  - Docusaurus
  - Azure Functions
  - Node-backed processes
  - Azurite

## Recommended consumption pattern

Keep the app policy in a wrapper script and compose this package's generic helpers inside it:

```js
import { buildPortlessUrl, WorktreeNodeDevRunner } from '@cellix/local-dev';

new WorktreeNodeDevRunner({
	settings: {
		BASE_URL: buildPortlessUrl('mock-auth.example.localhost'),
		PORT: '50000',
	},
}).start();
```

For settings files, let the app decide the keys and values. The shared syncer applies worktree URL suffixes, Mongo port offsets, and requested Azurite connection strings:

```js
import { WorktreeJsonFileSync } from '@cellix/local-dev';

new WorktreeJsonFileSync({
	sourcePath: 'local-settings.e2e.json',
	targetPath: 'deploy/local.settings.json',
	values: {
		ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.example.localhost:1355/community',
	},
	azuriteConnectionStringKeys: ['AzureWebJobsStorage'],
}).sync();
```

Azure Functions can do this directly in the runner so `func start` sees the prepared `local.settings.json` in its script root:

```js
import { WorktreeAzureFunctionsDevRunner } from '@cellix/local-dev';

new WorktreeAzureFunctionsDevRunner({
	localSettings: {
		e2eValues: {
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.example.localhost:1355/community',
		},
		azuriteConnectionStringKeys: ['AzureWebJobsStorage'],
	},
}).start();
```

Worktree transforms are enabled when a worktree name is available, either through
`worktreeName` or `WORKTREE_NAME`. Set `worktree: false` or
`CELLIX_WORKTREE=0` for regular dev scripts that should ignore an ambient
`WORKTREE_NAME`; set `worktree: true` or `CELLIX_WORKTREE=1` for explicit
worktree scripts.

## Public API

All exports are available from `@cellix/local-dev`. Folder-level subpaths are
also published for consumers that want narrower imports:

- `@cellix/local-dev/files`
- `@cellix/local-dev/process`
- `@cellix/local-dev/runners`
- `@cellix/local-dev/urls`
- `@cellix/local-dev/vite`
- `@cellix/local-dev/workspace`
- `@cellix/local-dev/worktree`

- `resolveWorkspaceRoot`
- `readDotEnv`
- `readJsonFile`
- `writeJsonFile`
- `syncJsonFile`
- `hostnameFromUrl`
- `sanitizeWorktreeHostnameLabel`
- `applyWorktreeSuffix`
- `buildPortlessUrl`
- `replaceUrlPort`
- `PORTLESS_PORT`
- `buildViteArgs`
- `isE2E`
- `forwardChildExit`
- `isGracefulInterruptExit`
- `ViteDevRunner`
- `DocusaurusDevRunner`
- `AzureFunctionsDevRunner`
- `NodeDevRunner`
- `AzuriteDevRunner`
- `WorktreeSettings`
- `WorktreeViteDevRunner`
- `WorktreeAzureFunctionsDevRunner`
- `WorktreeAzureFunctionsLocalSettings`
- `WorktreeMode`
- `WorktreeNodeDevRunner`
- `WorktreeAzuriteDevRunner`
- `WorktreeJsonFileSync`
- `getWorktreePortOffset`
- `getMongoPort`
- `getAzuritePorts`
- `buildAzuriteConnectionString`
- `runViteDev`
- `runDocusaurusDev`
- `runAzureFunctionsDev`
- `runNodeDev`
- `runAzuriteDev`
- `runTsxDev` deprecated compatibility alias

## Notes

- The package derives workspace roots from the caller's current working directory, but it does not infer app layouts or env-variable names.
- Worktree names are sanitized before they are inserted into `.localhost` hostnames so branch-style names such as `jason/my-feature` become DNS-safe labels such as `jason-my-feature`. Suffixing is idempotent for hostnames that already contain the sanitized worktree label.
- If a helper only exists to support one app's local policy, it should usually live with that app instead of being exported here.
