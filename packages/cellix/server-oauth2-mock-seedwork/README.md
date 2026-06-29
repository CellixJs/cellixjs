# @cellix/server-oauth2-mock-seedwork

Reusable OAuth2/OIDC mock server seedwork for local development and automated tests.

⚠️ For local development only. Never deploy to production.

## What this package provides

- OIDC discovery at `/.well-known/openid-configuration`
- JWKS at `/.well-known/jwks.json` (RS256)
- `GET /authorize` redirect handling
- `POST /token` token exchange with signed mock tokens
- `GET /userinfo` claims lookup from the issued bearer token
- Optional HTML login/signup flows when a `MockOAuth2UserStore` is provided
- A multi-registration manager for serving several named issuers from one process

## Install

```bash
pnpm add @cellix/server-oauth2-mock-seedwork
```

## Core usage

### Single issuer

```ts
import { startMockOAuth2Server } from '@cellix/server-oauth2-mock-seedwork';

const handle = await startMockOAuth2Server({
  port: 38204,
  baseUrl: 'http://127.0.0.1:38204',
  allowedRedirectUris: new Set(['http://localhost:3000/callback']),
  allowedRedirectUri: 'http://localhost:3000/callback',
  redirectUriToAudience: new Map([['http://localhost:3000/callback', 'mock-client']]),
  getUserProfile: () => ({
    email: 'user@example.com',
    given_name: 'Test',
    family_name: 'User',
  }),
});

await handle.disposer.stop();
```

### Multiple named issuers

```ts
import { createMockOAuth2Manager } from '@cellix/server-oauth2-mock-seedwork';

const manager = createMockOAuth2Manager({
  port: 38200,
  host: '127.0.0.1',
  baseUrl: 'http://127.0.0.1:38200',
});

await manager.register('portal', {
  allowedRedirectUris: new Set(['http://localhost:3000/callback']),
  allowedRedirectUri: 'http://localhost:3000/callback',
  redirectUriToAudience: new Map([['http://localhost:3000/callback', 'mock-client']]),
  getUserProfile: () => ({ email: 'user@example.com', given_name: 'Test', family_name: 'User' }),
});

await manager.stopAll();
```

## Interactive user stores

When a portal config includes `userStore`, the router exposes `/login` and `/signup` forms.

`MockOAuth2UserStore` is an async contract:

- `listUsers(): Promise<MockOAuth2User[]>`
- `findByUsername(username): Promise<MockOAuth2User | undefined>`
- `findBySub(sub): Promise<MockOAuth2User | undefined>`
- `addUser(user): Promise<void>`

This allows downstream implementations to use filesystem or database I/O on the request path while the router awaits the result.

Utility helpers

- `discoverPortalConfigs(appsDir)` — convenience utility that scans a monorepo `apps` directory for `ui-*` app mock-oidc.json entries and resolves their `.env` values. Useful for monorepo consumers that want to auto-register portals discovered across UI apps.
- `createFileUserStore(appDir)` — a simple filesystem-backed `MockOAuth2UserStore` implementation intended for local development (moved from the example app into this seedwork package).
- `ensurePortInUrl(baseUrl, port)` — a small helper that injects a non-default port into a base URL when omitted; preserves username, password, path, search, and hash components.

## Endpoint behavior

- `GET /authorize?...` validates the redirect target and forwards OIDC query params into interactive login when a user store is configured
- `POST /token` exchanges an authorization code for signed `id_token` and `access_token`, preserving passthrough claims such as `nonce`
- `GET /userinfo` resolves normalized claims from the bearer token and optional user store
- `GET /logout` redirects back to a validated local post-logout URI when provided

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 403 on preflight/CORS | Ensure requests originate from `localhost`, `127.0.0.1`, `*.localhost`, or an allowlisted redirect origin. |
| Redirect mismatch | Ensure the requested redirect URI exactly matches one of `allowedRedirectUris`. |
| Wrong audience or issuer | Align `redirectUriToAudience` and `baseUrl` with the values your client expects. |
| Login/signup data not updating | Ensure your `MockOAuth2UserStore` implementation reloads or persists data asynchronously as expected. |

ℹ️ The seedwork is stateless beyond in-memory auth-code and login-session TTL stores. Restart the server to reset keys and outstanding mock sessions.
