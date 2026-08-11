# `@cagematch/server-redis-memory-mock`

Runnable Redis development server for the rate-limiting cage match.

It mirrors the Mongo memory-server application pattern:

- `.env` supplies stable defaults
- `.env.local` optionally overrides them
- `dev` starts the normal local service
- `dev:worktree` uses the Redis-only `55000` base and adds the repository's deterministic worktree offset
- the root development graph starts it with the other persistent services

Redis is a non-HTTP dependency, so it intentionally does not receive a
portless hostname. This matches the repository's MongoDB pattern: the root
portless proxy still starts for browser-facing apps, while the Redis process is
isolated by its worktree-specific TCP port. API local-settings conversion uses
the same port calculation, so the client and server remain aligned.

API local settings contain `REDIS_URL=redis://127.0.0.1:51000`. Set `CAGEMATCH_USE_REDIS=true` to select the Redis contender.

```bash
pnpm --filter @cagematch/server-redis-memory-mock dev
```
