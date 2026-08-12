# @cagematch/server-redis-memory-mock Manifest

## Purpose

Compose the generic Redis memory-server seedwork with application cage-match defaults as a runnable local service.

## Scope

- `.env` and `.env.local` loading
- Application host, port, and optional Redis-version resolution
- `dev`, `dev:worktree`, and production-style `start` entrypoints

## Non-goals

- Implementing Redis process mechanics, rate limiting, application policies, or production infrastructure

## Public API shape

The root exports pure configuration resolution and the application starter for tests and controlled composition. The process entrypoint remains internal.

## Core concepts

The normal port is `51000`. Named worktrees use the Redis-only `55000` port band plus the deterministic worktree offset, keeping Redis disjoint from MongoDB's worktree ports. Redis is a non-HTTP dependency, so it follows the repository's internal-service pattern and is not routed through portless.

## Package boundaries

Only cage-match defaults and runnable-process composition belong here. Generic lifecycle stays in `@cagematch/server-redis-memory-mock-seedwork`.

## Dependencies / relationships

Consumes the generic cage-match seedwork and `@cellix/local-dev` for the worktree-aware development runner.

## Testing strategy

Test environment resolution, validation, and delegation through the package root. Generic seedwork separately proves live Redis behavior.

## Documentation obligations

Keep `.env`, README usage, configuration TSDoc, and API local settings aligned.

## Release-readiness standards

Package build/tests, generic live-server tests, worktree conversion tests, and root development orchestration must pass.
