# @cellix/mock-oauth2-server

Local OAuth2/OIDC mock server for development and testing.

⚠️ For local development only. Never deploy to production.

This service acts as a drop-in replacement for Azure AD B2C when running the OwnerCommunity API (@ocom/api) locally.

## Features

- OIDC discovery: `/.well-known/openid-configuration`
- JWKS: `/.well-known/jwks.json` (RS256)
- `GET /authorize` — redirects to a configured redirect URI with a mock `code`
- `POST /token` — returns `{ id_token, access_token, refresh_token, ... }`
- CORS locked down to local origins (localhost/127.0.0.1)

## Quick start

Note: this service starts automatically when running `npm run dev` at the repo root.

- Start emulator from repo root:

	```bash
	npm run start-emulator:auth-server
	```

- Or build and run from this package:

	```bash
	npm install
	npm run build
	npm start
	```

Server runs on http://localhost:4000 and logs the JWKS endpoint.

## Configuration

Environment variables (loaded from `.env`, override via `.env.local`):

- `ALLOWED_REDIRECT_URI` — Redirect target for `/authorize` (default: `http://localhost:3000/auth-redirect`)
- `Email` — Used in token claims (required)
- `Given_Name` — Used in token claims (required)
- `Family_Name` — Used in token claims (required)
- `Sub` — Subject/user ID for tokens (optional; random UUID if omitted)

> These values are mock user claims, not secrets. Change them to simulate different users in local development.

Example `.env.local`:

```ini
ALLOWED_REDIRECT_URI=http://localhost:3000/auth-redirect
Email=dev@example.com
Given_Name=Dev
Family_Name=User
Sub=11111111-1111-1111-1111-111111111111
```

### Endpoints

- `GET /.well-known/openid-configuration` — standard discovery document
- `GET /.well-known/jwks.json` — public signing key
- `GET /authorize?state=...` — redirects to `ALLOWED_REDIRECT_URI` with `code` and optional `state`
- `POST /token` — body supports `tid` and `refresh_token`; returns signed `id_token` and `access_token`

## Align with @ocom/api

`@ocom/api` reads OIDC config from `packages/api/local.settings.json` — ensure these point to this mock server:

- `ACCOUNT_PORTAL_OIDC_ENDPOINT`: `http://localhost:4000/.well-known/jwks.json`
- `ACCOUNT_PORTAL_OIDC_ISSUER`: `http://localhost:4000`
- `ACCOUNT_PORTAL_OIDC_AUDIENCE`: match your redirect (default `http://localhost:3000/auth-redirect`)
- `ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER`: `true` for local if you need to bypass issuer validation

## Troubleshooting

| Symptom                 | Fix                                                                |
| ----------------------- | ------------------------------------------------------------------ |
| 403 on preflight/CORS   | Ensure requests originate from `localhost` or `127.0.0.1`.         |
| Redirect mismatch       | Set `ALLOWED_REDIRECT_URI` to your actual app URL.                 |
| Invalid audience/issuer | Align `ACCOUNT_PORTAL_OIDC_*` values with this server’s endpoints. |

---

ℹ️ **Note:** This server is stateless. Restart it to reset keys/tokens.