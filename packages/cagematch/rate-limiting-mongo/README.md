# `@cagematch/rate-limiting-mongo`

MongoDB contender for `@cagematch/rate-limiting`.

```ts
import { ServiceMongoRateLimiting } from '@cagematch/rate-limiting-mongo';

const service = new ServiceMongoRateLimiting(
	() => database,
	[{ feature: 'community.create', accountType: 'account', limit: 5, windowMs: 60_000 }],
);
```

The adapter creates an `expiresAt` TTL index, uses an atomic conditional increment, and retries duplicate-key races without upsert. A denied weighted request reads the current counter once so `remaining` has the same meaning as the Redis contender. The fixed-window timestamp is part of the key, so expiration lag cannot extend a limit window.

The caller owns the MongoDB client and supplies only its database. The contender creates and owns the `cagematch-rate-limits` collection, document shape, and TTL index; application-specific code does not need a rate-limit schema or collection name. Start and stop this implementation through `ServiceRateLimiting` in normal Cellix composition.
