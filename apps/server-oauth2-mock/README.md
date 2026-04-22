# Mock OAuth2 Server

A lightweight OpenID Connect-compliant mock OAuth2 server for local development and testing.

## Key changes

This server now runs a single HTTP server and exposes multiple named OIDC portals via path-based routing. Example: a portal named `community` will be reachable at `https://.../<name>/.well-known/openid-configuration`.

## Configuration

Each UI app should provide `apps/ui-*/mock-oidc.json` that maps into the UI app's `.env` variables. The schema uses `envVars` to reference the UI app's environment variable names. The server auto-discovers portals by scanning `apps/` for `ui-*` directories and reading `mock-oidc.json` in each.

Example `mock-oidc.json`:

```json
{
  "name": "community",
  "envVars": {
    "clientId": "VITE_AAD_B2C_ACCOUNT_CLIENTID",
    "redirectUri": "VITE_AAD_B2C_REDIRECT_URI"
  },
  "claims": {
    "sub": "00000000-0000-0000-0000-000000000001",
    "email": "test@example.com"
  }
}
```

Notes about the schema and overrides:

- `mock-oidc.json` keys:
  - `name` — the portal name used in the server URL path and discovery
  - `envVars` — maps `clientId` and `redirectUri` to the UI app's environment variable names (e.g. `VITE_*` vars)
  - `claims` — default claims to include in issued tokens
- The server resolves the actual `clientId` and `redirectUri` by reading the UI app's `.env` (and `.env.local`) files and looking up the variable names listed in `envVars`.
- `mock-oidc.local.json` is git-ignored and may contain a shallow `claims` object to override or extend claims per developer. Only `claims` are merged from the local file.
- There is no top-level `clientId`, `redirectUri`, or `PORT_BASE` in `mock-oidc.json` — these values are resolved from the UI app environment.
- The app-level server exposes multiple portals under the single server base URL; each portal is reachable at `/{name}/.well-known/openid-configuration`.
## Environment variables

- PORT - port the single mock server listens on (default: 1355)
- BASE_URL - public base URL for the mock server (e.g. `https://mock-auth.ownercommunity.localhost:1355`)

## Running

- Start the server as before. It will discover portals and register them under `/{name}` on the single HTTP server.

## Notes

- `mock-oidc.local.json` is still supported for claim overrides.
- The per-portal JSON no longer contains direct `clientId` or `redirectUri` values; those are read from the UI app's `.env` using `envVars`.
- Backward-compatible single-config mode via `startMockOAuth2Server()` is preserved.
