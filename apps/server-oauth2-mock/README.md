# Mock OAuth2 Server

A lightweight OpenID Connect-compliant mock OAuth2 server for local development and testing. This server simulates OAuth2/OIDC flows without requiring external authentication infrastructure.

## Quick Start

### Development Mode (with Portless)

```bash
pnpm run dev
```

This starts the mock server with [Portless](https://portless.io/) for local domain routing:
- **Server URL**: `https://mock-auth.ownercommunity.localhost`
- **JWKS Endpoint**: `https://mock-auth.ownercommunity.localhost/.well-known/jwks.json`
- **OpenID Configuration**: `https://mock-auth.ownercommunity.localhost/.well-known/openid-configuration`

### Direct Mode (no Portless)

```bash
pnpm run build
pnpm run start
```

Note: This mock server is intended for local development and testing only — do not run it in production.

When running without Portless the server binds directly to the configured `PORT`. In dev/Portless mode Portless will assign the runtime port and set the `PORT` environment variable automatically; if Portless does not provide a port the server falls back to `4000`.

## Configuration

### Environment Variables

All configuration is done via environment variables in `.env` or `.env.local`:

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://mock-auth.ownercommunity.localhost` | Server base URL (must match actual URL) |
| `ALLOWED_REDIRECT_URI` | `https://ownercommunity.localhost/auth-redirect` | Whitelisted OAuth2 redirect URI |
| `CLIENT_ID` | `mock-client` | OAuth2 client ID |
| `EMAIL` | `test@example.com` | User email in tokens |
| `GIVEN_NAME` | `Test` | User given name in tokens |
| `FAMILY_NAME` | `User` | User family name in tokens |
| `SUB` | *auto-generated* | User subject ID (optional - see below) |
| `TID` | `test-tenant-id` | Tenant ID in tokens |
| `PORT` | `4000` | Server port. In dev/portless mode the port is assigned automatically; in direct/production mode this controls the bind port (default 4000). |
| `PORTLESS_URL` | *not set* | Portless proxy URL (set automatically in dev mode) |

### User Identity & Session Persistence

**Important**: The mock server ensures the **same user identity persists across multiple logins** automatically.

#### Default Behavior (Recommended)
```bash
# No SUB env variable set
```

The server generates a UUID once at startup and reuses it for all token requests. This ensures:
- ✅ Same user ID across multiple logins
- ✅ Session persistence works automatically
- ✅ No configuration needed

#### Custom User ID
```bash
# In .env or .env.local
SUB=my-custom-user-id
```

Set `SUB` to use a specific, predictable user ID. Useful for:
- Matching hardcoded test data
- Debugging with specific user IDs
- Cross-environment consistency

## Supported OpenID Connect Endpoints

### GET `/.well-known/openid-configuration`
Returns OpenID Connect server metadata.

### GET `/.well-known/jwks.json`
Returns JWKS (JSON Web Key Set) for token verification.

### GET `/authorize`
OAuth2 authorization endpoint. Returns a mock authorization code.

**Query Parameters**:
- `redirect_uri` - Client redirect URI (must match whitelist)
- `state` - State parameter (passed through to redirect)

**Example**:
```
GET https://mock-auth.ownercommunity.localhost/authorize?redirect_uri=https://ownercommunity.localhost/auth-redirect&state=abc123
```

### POST `/token`
Exchanges authorization code for tokens.

**Request Body**:
```json
{
  "code": "mock-auth-code-...",
  "grant_type": "authorization_code"
}
```

**Response**:
```json
{
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "uuid-string",
  "token_type": "Bearer",
  "expires_at": 1234567890
}
```

### GET `/userinfo`
Returns user information. Requires Bearer token authorization.

**Request Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "sub": "user-id",
  "email": "test@example.com",
  "given_name": "Test",
  "family_name": "User",
  "name": "Test User",
  "username": "test"
}
```

### GET `/logout`
Logout endpoint for OIDC logout flows.

## Integration with Applications

### TypeScript/JavaScript Clients
Use any OIDC client library (e.g., `oidc-client-ts`, `@auth/core`) with:

```typescript
const config = {
  authority: 'https://mock-auth.ownercommunity.localhost',
  clientId: 'mock-client',
  redirectUri: 'https://ownercommunity.localhost/auth-redirect',
  scopes: ['openid', 'profile', 'email'],
};
```

### Common Issues

**"Invalid redirect_uri"**
- Ensure `ALLOWED_REDIRECT_URI` matches exactly (including protocol, domain, path, trailing slash)
- Check the redirect URI in your application config

**Different user ID on each login**
- The old behavior (before fix) generated a new UUID per request
- Update to the latest version to get automatic session persistence

**Port already in use**
- Set `PORT` environment variable to use a different port
- Or kill existing process: `lsof -i :4000`

## Architecture

This package is built on:
- **seedwork** (`@cellix/server-oauth2-mock-seedwork`) - Core OAuth2 server logic
- **Express** - HTTP server framework
- **jose** - JWT signing and verification
- **dotenv** - Environment variable management

The seedwork is separate to allow reuse in other packages while keeping application-specific configuration isolated.

## Development

```bash
# Build
pnpm run build

# Lint
pnpm run lint

# Format
pnpm run format

# Run development server
pnpm run dev

# Run production server
pnpm run start
```
