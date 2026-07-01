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
import { buildPortlessUrl, NodeDevRunner } from '@cellix/local-dev';

new NodeDevRunner({
	settings: {
		BASE_URL: buildPortlessUrl('mock-auth.example.localhost'),
		PORT: '50000',
	},
}).start();
```

For settings files, let the app decide the document shape and any app-owned transform:

```js
import { syncJsonFile } from '@cellix/local-dev';

syncJsonFile({
	sourcePath: 'local-settings.e2e.json',
	targetPath: 'deploy/local.settings.json',
	transform: (document) => ({
		...document,
		Values: {
			...document.Values,
			MODE: 'e2e',
		},
	}),
});
```

Azure Functions can sync worktree-aware values directly in the runner so `func start` sees the prepared `local.settings.json` in its script root:

```js
import { AzureFunctionsDevRunner } from '@cellix/local-dev';

new AzureFunctionsDevRunner({
	localSettings: {
		e2eValues: {
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.example.localhost:1355/community',
		},
		worktreeConversion: {
			urlKeys: ['ACCOUNT_PORTAL_OIDC_ISSUER'],
			azuriteKeys: ['AzureWebJobsStorage'],
		},
	},
}).start();
```

Code that consumes the same settings outside the Functions host can resolve
them without writing `local.settings.json`:

```js
import { resolveAzureFunctionsLocalSettingsValues } from '@cellix/local-dev';

const values = resolveAzureFunctionsLocalSettingsValues({
	values: { DATABASE_URL: 'mongodb://127.0.0.1:50000/app' },
	worktreeConversion: { mongoKeys: ['DATABASE_URL'] },
});
```

The resolver applies worktree conversion only when `WORKTREE_NAME` (or an
explicit `worktreeName`) is present. Regular E2E and dev runs keep the base
values.

Worktree transforms are enabled when a worktree name is available, either through
`worktreeName` or `WORKTREE_NAME`. This lets regular and worktree package scripts
share the same wrapper: the root `dev:worktree` command supplies `WORKTREE_NAME`,
while regular `dev` does not. Advanced programmatic callers can pass
`worktree: false` to ignore an ambient worktree name.

`WorktreeSettings` transforms complete `http(s)://` and `mongodb://` string
values, including complete URL values nested in objects or arrays. It leaves URLs
embedded in descriptive text unchanged. Use `convertSettingsForWorktree` when
the application needs explicit key-level conversion policy.

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
- `AzureFunctionsLocalSettings`
- `resolveAzureFunctionsLocalSettingsValues`
- `WorktreeMode`
- `convertSettingsForWorktree`
- `WorktreeConversionPlan`
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
