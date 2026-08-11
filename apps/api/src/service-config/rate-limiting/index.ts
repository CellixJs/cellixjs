import type { RateLimitPolicy } from '@cagematch/rate-limiting';

/** Application policy; reusable rate-limit packages do not know these attributes. */
export const policies: readonly RateLimitPolicy[] = [
	{ feature: 'community.create', criteria: { actorType: 'account' }, limit: 5, windowMs: 15 * 60_000 },
	{ feature: 'community.create', criteria: { actorType: 'staff' }, limit: 20, windowMs: 15 * 60_000 },
];
