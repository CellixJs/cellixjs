# `@cagematch/server-redis-memory-mock`

Runnable application Redis server for the rate-limiting cage match.

It mirrors the Mongo memory-server application pattern:

- `.env` supplies stable defaults
- `.env.local` optionally overrides them
- `dev` starts the normal local service
- `dev:worktree` shifts port `51000` by the repository worktree offset
- the root development graph starts it with the other persistent services

API local settings contain `REDIS_URL=redis://127.0.0.1:51000`. Set `CAGEMATCH_USE_REDIS=true` to select the Redis contender.

```bash
pnpm --filter @cagematch/server-redis-memory-mock dev
```
