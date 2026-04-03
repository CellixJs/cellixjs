# @cellix/server-oauth2-mock-seedwork

Reusable OAuth2/OIDC mock server seedwork for development and testing.

⚠️ For local development only. Never deploy to production.

This package provides the reusable server logic used by app-level mock OAuth2 services.

## Features

- OIDC discovery: `/.well-known/openid-configuration`
- JWKS: `/.well-known/jwks.json` (RS256)
- `GET /authorize` — redirects to a configured redirect URI with a mock `code`
- `POST /token` — returns `{ id_token, access_token, refresh_token, ... }`
- CORS restricted to local origins (127.0.0.1, localhost, and `*.localhost`) and configured redirect origins

## Usage

In CellixJS applications, the runnable HTTP process lives in `@apps/server-oauth2-mock`. This seedwork package exports the reusable startup logic and types consumed by that app package.

- Build the seedwork package:

	```bash
	pnpm --filter @cellix/server-oauth2-mock-seedwork run build
	```

- Run the CellixJS mock auth app:

	```bash
	pnpm --filter @apps/server-oauth2-mock run dev
	```

## Configuration

The app package supplies runtime configuration such as:

- `baseUrl`
- `allowedRedirectUris`
- `allowedRedirectUri` (singular) — the primary redirect URI used when no `redirect_uri` is provided to `/authorize`
- user profile generation

### Endpoints

- `GET /.well-known/openid-configuration` — standard discovery document
- `GET /.well-known/jwks.json` — public signing key
- `GET /authorize?state=...&redirect_uri=...` — validates the redirect target and returns a mock authorization code
- `POST /token` — exchanges the code for signed `id_token` and `access_token`

## CellixJS integration

CellixJS configures this seedwork through `@apps/server-oauth2-mock` and points `@apps/api` at the app's public URL:

- `ACCOUNT_PORTAL_OIDC_ENDPOINT`: `https://mock-auth.ownercommunity.localhost/.well-known/jwks.json`
- `ACCOUNT_PORTAL_OIDC_ISSUER`: `https://mock-auth.ownercommunity.localhost`
- `ACCOUNT_PORTAL_OIDC_AUDIENCE`: match your redirect (default `https://ownercommunity.localhost/auth-redirect`)
- `ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER`: `true` for local if you need to bypass issuer validation

## Troubleshooting

| Symptom                 | Fix                                                                |
| ----------------------- | ------------------------------------------------------------------ |
| 403 on preflight/CORS   | Ensure requests originate from `localhost` or `127.0.0.1`.         |
| Redirect mismatch       | Ensure the app package allowlists the UI redirect URI.             |
| Invalid audience/issuer | Align `ACCOUNT_PORTAL_OIDC_*` values with this server’s endpoints. |

---

ℹ️ **Note:** The seedwork is stateless. Restart the app-level mock service to reset keys and tokens.
