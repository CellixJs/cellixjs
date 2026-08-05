import type { RateLimitPolicy } from '@cagematch/rate-limiting';

const { CAGEMATCH_USE_REDIS, REDIS_URL } = process.env;

interface RateLimitingBackendConfig {
	readonly backend: 'mongo' | 'redis';
	readonly redisConnectionString?: string;
}

/** Resolves and validates the explicit cage-match backend selection. */
export function resolveRateLimitingBackendConfig(useRedis: string | undefined, redisUrl: string | undefined): RateLimitingBackendConfig {
	if (useRedis !== 'true') {
		return { backend: 'mongo' };
	}
	if (!redisUrl) {
		throw new Error('REDIS_URL is required when CAGEMATCH_USE_REDIS=true');
	}
	return { backend: 'redis', redisConnectionString: redisUrl };
}

const backendConfig = resolveRateLimitingBackendConfig(CAGEMATCH_USE_REDIS, REDIS_URL);

/** Selects the rate-limit storage implementation independently of NODE_ENV. */
export const useRedisRateLimiting = backendConfig.backend === 'redis';
export const redisConnectionString = backendConfig.redisConnectionString ?? '';

/**
 * Policies are application configuration; the cagematch packages only enforce
 * them. Features are the primary boundary, with stable account classes used
 * only when their traffic profiles justify different capacity.
 */
export const policies: readonly RateLimitPolicy[] = [
	{ feature: 'community.create', accountType: 'account', limit: 5, windowMs: 15 * 60_000 },
	{ feature: 'community.create', accountType: 'staff', limit: 20, windowMs: 15 * 60_000 },
];
