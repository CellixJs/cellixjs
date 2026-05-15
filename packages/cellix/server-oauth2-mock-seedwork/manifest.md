# manifest.md - @cellix/server-oauth2-mock-seedwork

Package: @cellix/server-oauth2-mock-seedwork

Purpose:
- Lightweight seedwork providing a mock OAuth2/OIDC server for local development and tests.

Public exports:
- startMockOAuth2Server(config): Promise<MockOAuth2ServerHandle>
- createMockOAuth2Manager(): manager capable of registering multiple named configs

Downstream consumers (within monorepo):
- @apps/server-oauth2-mock (app-level runnable)

Non-goals:
- Production-ready IdP replacement
- Persistent token storage

Notes:
- Addition of createMockOAuth2Manager is additive and preserves backward compatibility with startMockOAuth2Server.
- Tests cover multi-registration and token isolation behaviors.
