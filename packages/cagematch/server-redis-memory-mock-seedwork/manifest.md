# @cagematch/server-redis-memory-mock-seedwork Manifest

## Purpose

Provide reusable lifecycle seedwork for starting a real, isolated Redis process during local development and integration testing.

## Scope

- Redis binary preparation through `redis-memory-server`
- Bind-address, port, and optional binary-version configuration
- Connection URL resolution and idempotent shutdown

## Non-goals

- OCOM environment defaults, rate-limit policies, data seeding, or production Redis provisioning
- Exposing the third-party server implementation as part of the public contract

## Public API shape

The root exports `startRedisMemoryServer` and its configuration, result, and disposer contracts.

## Core concepts

The package starts an actual `redis-server` child process. It is memory-backed but uses the real Redis protocol and Lua engine.

## Package boundaries

Binary management and generic process lifecycle stay here. Application composition belongs in a separate package.

## Dependencies / relationships

The OCOM cage-match server package consumes this seedwork. Redis contender integration tests use it to verify real Lua execution.

## Testing strategy

Start the server through the package root, connect with the standard Redis client, run `PING`, `SET`, and `GET`, then verify idempotent disposal.

## Documentation obligations

Keep this manifest, `README.md`, and public TSDoc aligned with lifecycle and configuration behavior.

## Release-readiness standards

Build, lint, public contract tests, live Redis integration, dependency audit, and supported-platform binary preparation must pass.
