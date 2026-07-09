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

Use this package as the OCOM source of local URLs, then pass those values into the generic Cellix worktree runners:

```ts
import { ViteDevRunner } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const urls = buildOcomUrls();

new ViteDevRunner({
	settings: {
		VITE_APP_UI_COMMUNITY_BASE_URL: urls.uiCommunityBaseUrl,
		VITE_COMMON_API_ENDPOINT: urls.apiGraphqlUrl,
	},
}).start();
```

## Public API

All exports are available from `@ocom/local-dev-config`. Focused subpaths are
also published for narrower imports:

- `@ocom/local-dev-config/hostnames`
- `@ocom/local-dev-config/urls`

- `getOcomHostnames(options?)`
- `buildOcomUrls(options?)`
- `buildOcomApiLocalSettings(options?)`
- `OcomLocalDevOptions`
- `OcomHostnames`
- `OcomUrls`

## Boundaries

- Keep reusable process runners, dotenv parsing, JSON syncing, and port math in `@cellix/local-dev`.
- Keep OCOM-specific hostname derivation, auth paths, redirect paths, and app `.env` lookup policy here.
- Keep one-off runtime behavior in the consuming app wrapper script instead of widening this package.
- Keep app wrapper scripts thin: get OCOM URL values here, pass them into a generic `@cellix/local-dev` worktree object, and call `start()` or `sync()`.
