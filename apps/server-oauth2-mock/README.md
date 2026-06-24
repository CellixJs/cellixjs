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
    "clientId": "VITE_APP_UI_COMMUNITY_B2C_CLIENTID",
    "redirectUri": "VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI"
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
  - `claims` — default claims to include in issued tokens (note: this file is version-controlled; use per-user overlay files for development)
- The server resolves the actual `clientId` and `redirectUri` by reading the UI app's `.env` (and `.env.local`) files and looking up the variable names listed in `envVars`.
- **`mock-oidc.local.json` is no longer supported** — it is completely ignored by the server. To customize claims for local development, use per-portal user overlay files (`mock-oidc.users.local.json`) instead.
- There is no top-level `clientId`, `redirectUri`, or `PORT_BASE` in `mock-oidc.json` — these values are resolved from the UI app environment.
- The app-level server exposes multiple portals under the single server base URL; each portal is reachable at `/{name}/.well-known/openid-configuration`.

## Environment variables

- PORT - port the single mock server listens on (default: 1355). For local development with portless and HTTPS custom domains we recommend setting `PORT=443` in your `.env` so the server binds to the standard HTTPS port.
- BASE_URL - public base URL for the mock server (e.g. `https://mock-auth.ownercommunity.localhost`) — do not include `:443` when using the standard HTTPS port; portless maps custom domains to 443.

See ADR-0028 — Portless Local Development (apps/docs/docs/decisions/0028-portless-local-development.md) for the canonical proxy start/stop commands.


## Running

- Start the server as before. It will discover portals and register them under `/{name}` on the single HTTP server.

## Notes

- ~~`mock-oidc.local.json` claim overrides~~ — **no longer supported**; use `mock-oidc.users.local.json` for per-developer user overrides instead.
- The per-portal JSON no longer contains direct `clientId` or `redirectUri` values; those are read from the UI app's `.env` using `envVars`.
- Backward-compatible single-config mode via `startMockOAuth2Server()` is preserved.

Per-portal user files

- To enable interactive multi-user login/signup flows for a portal, add `mock-oidc.users.json` (committed sample users) and optional `mock-oidc.users.local.json` (developer overlay) under the portal app directory (e.g. `apps/ui-community/mock-oidc.users.json`).
- The app-level user store reads these files on every request so edits to the `.local.json` overlay are picked up immediately while the server is running.
- For details on the user file format and security caveats (plain-text passwords, dev-only), see the seedwork README: `packages/cellix/server-oauth2-mock-seedwork/README.md`.

### mock-oidc.json format

- The per-portal configuration file `mock-oidc.json` accepts an array of configs. Example:

```json
[
  {
    "name": "community",
    "envVars": {
      "clientId": "VITE_APP_UI_COMMUNITY_B2C_CLIENTID",
      "redirectUri": "VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI"
    },
    "claims": { "sub": "00000000-0000-0000-0000-000000000001" }
  },
  {
    "name": "community-alt",
    "envVars": { "clientId": "VITE_APP_UI_COMMUNITY_ALT_CLIENTID", "redirectUri": "VITE_APP_UI_COMMUNITY_ALT_REDIRECT_URI" }
  }
]
```

- A single-object file is supported for backward compatibility (the server will coerce it into a one-element array).

### Env var naming

- Env var keys referenced in `envVars` should follow the repository convention:
  - Portal-specific: `VITE_APP_<PORTAL_NAME>_<NAME>` (e.g. `VITE_APP_UI_COMMUNITY_B2C_CLIENTID`)
  - Shared/common: `VITE_COMMON_<NAME>` (e.g. `VITE_COMMON_API_ENDPOINT`)
- The mock server validates this convention and will emit a console.warn if a referenced env var key does not follow it (non-fatal). See `apps/docs/docs/decisions/0031-ui-env-vars.md` for details.

### Registration keys

- Each discovered mock OIDC config is registered under a composed, globally-unique registration key: `{portal-directory-name}-{config.name}` (for example `ui-community-community` or `ui-community-community-alt`).
- The composed registration key is validated and collisions are rejected with a descriptive error indicating the two sources that would conflict.

### Claims

- The `claims` field in `mock-oidc.json` must be a plain JSON object (arrays are allowed as values for individual claim keys, e.g. `roles: ["admin"]`).
- If `claims` is omitted, the portal's default user profile resolution is used instead.
