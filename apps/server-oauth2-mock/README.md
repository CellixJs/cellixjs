# Mock OAuth2 Server

A lightweight OpenID Connect-compliant mock OAuth2 server for local development and testing. This server simulates OAuth2/OIDC flows without requiring external authentication infrastructure.

## Quick Start

### Development Mode (with Portless)

```bash
pnpm run dev
```

This starts the mock server with Portless for local domain routing. When running in dev mode the mock server will auto-register one OIDC mock per discovered portal (see below).

### Direct Mode (no Portless)

```bash
pnpm run build
pnpm run start
```

Note: This mock server is intended for local development and testing only — do not run it in production.

## Configuration and Portals

Purpose: The mock OAuth2 server provides a local OIDC mock for development. It scans `apps/ui-*/mock-oidc.json` at startup and registers one OIDC mock server per portal.

How it works:
- At startup the server looks for directories under `apps/` named `ui-*` and attempts to read `mock-oidc.json` from each.
- For each valid `mock-oidc.json` it registers a named OIDC mock server using the `name` value.
- If a `mock-oidc.local.json` file exists alongside `mock-oidc.json`, its `claims` object is shallow-merged into the main `claims` (local overrides only affect claim keys).
- Ports are assigned deterministically: each portal receives `PORT_BASE + index` where `index` is the portal's position when ui-* directories are sorted by name.

Example `mock-oidc.json` schema:

```json
{
  "name": "community",
  "baseUrl": "https://mock-auth.ownercommunity.localhost:1355",
  "clientId": "mock-client",
  "redirectUri": "https://ownercommunity.localhost:1355/auth-redirect",
  "claims": {
    "sub": "00000000-0000-0000-0000-000000000001",
    "email": "test@example.com",
    "given_name": "Test",
    "family_name": "User",
    "tid": "test-tenant-id"
  }
}
```

Local claim overrides:
- To override claims for your local dev session create `mock-oidc.local.json` next to `mock-oidc.json` in any `apps/ui-*/` directory. This file is gitignored by default.
- Only the `claims` object is merged; other fields in `mock-oidc.local.json` are ignored for merging purposes.

Adding a new portal:
- Add a new folder `apps/ui-newportal/` and create `mock-oidc.json` inside it. The mock server will pick it up automatically on next startup.

Port assignment and environment variables:
- The only environment variable used by this service is `PORT_BASE` (default `3001`) which you can set in the mock server's `.env`.
- Each portal is assigned `PORT_BASE + index` where `index` is the zero-based order of sorted `ui-*` directories.
- All OIDC configuration and user claims are provided in `mock-oidc.json` files; do not rely on VITE_* variables or other per-portal `.env` files.

Notes:
- If a `mock-oidc.json` file is malformed or missing required fields (name, baseUrl, clientId, redirectUri, claims) it will be skipped with a warning; the server continues to run for other valid portals.
- `mock-oidc.local.json` is gitignored by default — use it for per-developer local overrides.

## User Identity & Session Persistence

The server generates or uses the configured `SUB` to provide a stable user id across logins. If `SUB` is not set a UUID is generated at startup and reused.

## Multi-portal behavior

For each discovered portal `ui-<name>` the server registers a named OIDC config using the name `<name>` (the `ui-` prefix is stripped). Each registered config includes:
- baseUrl from `VITE_AAD_B2C_ACCOUNT_AUTHORITY`
- clientId from `VITE_AAD_B2C_ACCOUNT_CLIENTID`
- allowed redirect URI from `VITE_AAD_B2C_REDIRECT_URI`
- port assigned from `PORT_BASE + index`

Mock user profile environment variables (`EMAIL`, etc.) apply to all portals. Future enhancements may allow per-portal overrides.

## Supported OpenID Connect Endpoints

- `GET /.well-known/openid-configuration`
- `GET /.well-known/jwks.json`
- `GET /authorize`
- `POST /token`
- `GET /userinfo`
- `GET /logout`

## Development

```bash
# Build
pnpm run build

# Lint
pnpm run lint

# Run development server
pnpm run dev
```
