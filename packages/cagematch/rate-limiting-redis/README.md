# `@cagematch/rate-limiting-redis`

Redis contender for `@cagematch/rate-limiting`.

## Usage

```ts
import { createRedisRateLimitingClient, ServiceRedisRateLimiting } from '@cagematch/rate-limiting-redis';

const client = createRedisRateLimitingClient({ url: process.env.REDIS_URL });
const service = new ServiceRedisRateLimiting(client, [
	{ feature: 'community.create', accountType: 'account', limit: 5, windowMs: 60_000 },
]);
```

The Redis implementation is deliberately split into readable layers:

1. `fixed-window-counter.lua.ts` contains only the atomic counter algorithm and its `KEYS`/`ARGV` contract.
2. `consume-rate-limit.script.ts` maps a named TypeScript command to that Lua contract and maps Redis's tuple to `{ allowed, remaining }`.
3. `redis-rate-limiting.ts` computes the fixed-window expiry and delegates one decision to the registered command.

Node Redis uses the script hash for normal calls and automatically evaluates the script when Redis does not have it cached. The store validates the named result once more because `RedisRateLimitingClient` is a public structural boundary that also supports controlled test doubles.

The adapter performs one server-side operation per attempt so create, increment, and deny decisions remain atomic. It connects and quits its dedicated Redis client during service lifecycle. The client factory always installs an error listener; pass `onError` when application-specific telemetry is required.

Start and stop this implementation through `ServiceRateLimiting` in normal Cellix composition.
