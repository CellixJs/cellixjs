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
- Generic dev runners for:
  - Vite
  - Docusaurus
  - Azure Functions
  - TSX-backed processes
  - Azurite

## Recommended consumption pattern

Keep the app policy in a wrapper script and compose this package's generic helpers inside it:

```js
import { buildPortlessUrl, getMongoPort, runTsxDev } from '@cellix/local-dev';

runTsxDev({
	env: {
		...process.env,
		BASE_URL: buildPortlessUrl('mock-auth.example.localhost'),
		PORT: String(getMongoPort(process.env.WORKTREE_NAME)),
	},
});
```

For settings files, let the app decide what to change:

```js
import { syncJsonFile } from '@cellix/local-dev';

syncJsonFile({
	sourcePath: 'local-settings.e2e.json',
	targetPath: 'deploy/local.settings.json',
	transform: (document) => ({
		...document,
		Values: {
			...(document.Values ?? {}),
			MODE: 'e2e',
		},
	}),
});
```

## Public API

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
- `getWorktreePortOffset`
- `getMongoPort`
- `getAzuritePorts`
- `buildAzuriteConnectionString`
- `runViteDev`
- `runDocusaurusDev`
- `runAzureFunctionsDev`
- `runTsxDev`
- `runAzuriteDev`

## Notes

- The package derives workspace roots from the caller's current working directory, but it does not infer app layouts or env-variable names.
- Worktree names are sanitized before they are inserted into `.localhost` hostnames so branch-style names such as `jason/my-feature` become DNS-safe labels such as `jason-my-feature`. Suffixing is idempotent for hostnames that already contain the sanitized worktree label.
- If a helper only exists to support one app's local policy, it should usually live with that app instead of being exported here.
