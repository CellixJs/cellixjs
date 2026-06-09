# @ocom/local-dev-config

OCOM-specific local-development URL and hostname helpers built on `@cellix/local-dev`.

This package owns Owner Community application policy: which app `.env` files define local hostnames, which auth issuer paths are used, and which URLs app wrapper scripts should inject. Generic mechanics such as dotenv parsing, portless URL construction, and worktree-safe hostname suffixing stay in `@cellix/local-dev`.

## Install

```json
{
	"devDependencies": {
		"@ocom/local-dev-config": "workspace:*"
	}
}
```

## Usage

Use this package from app-owned `start-dev.ts` or settings-sync wrappers:

```ts
import { runViteDev } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const urls = buildOcomUrls();

runViteDev({
	env: {
		...process.env,
		VITE_COMMON_API_ENDPOINT: urls.apiGraphqlUrl,
		VITE_APP_UI_COMMUNITY_BASE_URL: urls.uiCommunityBaseUrl,
	},
});
```

## Public API

- `getOcomHostnames(options?)`
- `buildOcomUrls(options?)`
- `getWorkspaceRoot(startDir?)`
- `OcomLocalDevOptions`
- `OcomHostnames`
- `OcomUrls`

## Boundaries

- Keep reusable process runners, dotenv parsing, JSON syncing, and port math in `@cellix/local-dev`.
- Keep OCOM-specific hostname derivation, auth paths, redirect paths, and app `.env` lookup policy here.
- Keep one-off runtime behavior in the consuming app wrapper script instead of widening this package.
