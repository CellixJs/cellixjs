# `@cagematch/rate-limiting`

Backend-neutral fixed-window rate limiting for the MongoDB-versus-Redis cage match.

Policies select a feature first. A stable account type can override the feature default, and a stable staff role can override the staff account policy. Tenant-defined account roles are deliberately not selectors because they are mutable business authorization data.

```ts
import { createRateLimitingService } from '@cagematch/rate-limiting';

const limiter = createRateLimitingService(store, [
	{ feature: 'community.create', limit: 5, windowMs: 60_000 },
	{ feature: 'community.create', accountType: 'staff', limit: 20, windowMs: 60_000 },
]);

const decision = await limiter.consume({
	feature: 'community.create',
	subject: { id: 'account-123', accountType: 'account' },
});
```

A feature with no matching policy is allowed without calling the store. Policy configuration is validated when the service is created, so duplicate selectors, invalid staff-role policies, and configured costs outside `1..limit` fail before backend startup.

Subject IDs must be stable and unique within their tenant. Do not configure an anonymous policy while passing one shared value such as `anonymous`; derive a privacy-safe client identifier at the transport edge first.
