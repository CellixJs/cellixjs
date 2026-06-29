# manifest.md - @cellix/server-oauth2-mock-seedwork

## Purpose

Provide reusable mock OAuth2/OIDC server seedwork for local development, integration tests, and browser login simulations.

## Scope

This package owns the public router, server bootstrap helpers, multi-registration manager, URL helpers, debug logging helper, and public configuration/data types needed to host a mock OIDC issuer.

## Non-goals

- Production-ready identity provider behavior
- Durable token storage or revocation infrastructure
- User-management UI beyond the minimal local-development login/signup forms

## Public API shape

- `startMockOAuth2Server(config): Promise<MockOAuth2ServerHandle>`
- `createMockOAuth2Manager({ port, host?, baseUrl, trustProxy? }): MockOAuth2Manager`
- `buildOidcRouter(issuerBaseUrl, config): Promise<express.Router>`
- `debugLog(message, data?): void`
- `discoverPortalConfigs(appsDir): PortalOidcConfig[]` — helper to locate UI app mock-oidc.json configs and resolve env values
- `createFileUserStore(appDir): MockOAuth2UserStore` — simple filesystem-backed user store used by the app for interactive login/signup flows
- `ensurePortInUrl(baseUrl, port): string` — utility to inject a port into a URL when omitted (preserves components)
- `normalizeBaseUrl(url)`, `normalizeOrigin(url)`, `normalizeUrl(url)`, `SAFE_NAME_RE`
- Public types from `src/types.ts`, especially `MockOAuth2PortalConfig`, `MockOAuth2ServerConfig`, and the async `MockOAuth2UserStore`

## Core concepts

- One issuer can be hosted directly with `startMockOAuth2Server`, or many named issuers can share one process via `createMockOAuth2Manager`.
- `MockOAuth2UserStore` is intentionally async so downstream stores can perform filesystem or database I/O on the request path.
- Interactive login/signup flows persist short-lived nonces server-side and exchange them for auth codes without echoing untrusted query data into HTML.

## Package boundaries

- Keep login/signup route composition, HTML builders, TTL stores, and claim-merging helpers internal unless an external consumer has a clear need.
- `src/login-handlers.ts` is internal implementation detail extracted only to keep `router.ts` focused.
- The package should not expose app-specific file-store behavior or monorepo-only bootstrapping concerns.

## Dependencies / relationships

- Downstream consumer in this monorepo: `@apps/server-oauth2-mock`
- Depends on `express`, `express-rate-limit`, and `jose` for HTTP routing, rate limiting, and JWT/JWKS behavior

## Testing strategy

- Prefer public-entrypoint tests that exercise `buildOidcRouter`, `createMockOAuth2Manager`, and `startMockOAuth2Server` end-to-end.
- Preserve contract tests for interactive login/signup, token issuance, userinfo, multi-registration isolation, and URL helper behavior.
- Avoid adding tests for internal helpers when an existing public-contract test already proves the behavior.

## Documentation obligations

- Keep `README.md` consumer-facing and package-centric.
- Keep TSDoc aligned for meaningful public exports and public types.
- Update this manifest whenever package boundaries, public exports, or release caveats change.

## Release-readiness standards

- Public entrypoint exports remain intentionally narrow.
- Package build and existing test suites for the seedwork and affected downstream consumer must pass.
- Any breaking change to `MockOAuth2UserStore` or other public exports requires explicit semver review before release.
