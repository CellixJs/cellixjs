# `@cagematch/rate-limiting-redis`

Redis contender for `@cagematch/rate-limiting`.

```ts
import { createClient } from 'redis';
import { ServiceRedisRateLimiting } from '@cagematch/rate-limiting-redis';

const service = new ServiceRedisRateLimiting(createClient({ url: process.env.REDIS_URL }), [
	{ feature: 'community.create', accountType: 'account', limit: 5, windowMs: 60_000 },
]);
```

The adapter evaluates one Lua script per attempt so create, increment, and deny decisions are atomic. It connects and quits its dedicated Redis client during service lifecycle.

Start and stop this implementation through `ServiceRateLimiting` in normal Cellix composition.
