import { describe, expect, it } from 'vitest';
import { policies, resolveRateLimitingBackendConfig } from './index.ts';

describe('rate-limiting configuration', () => {
	it('uses MongoDB unless Redis is explicitly selected', () => {
		expect(resolveRateLimitingBackendConfig(undefined, undefined)).toEqual({ backend: 'mongo' });
		expect(resolveRateLimitingBackendConfig('false', 'redis://ignored')).toEqual({ backend: 'mongo' });
	});

	it('requires a connection string when Redis is selected', () => {
		expect(() => resolveRateLimitingBackendConfig('true', undefined)).toThrow('REDIS_URL is required');
		expect(resolveRateLimitingBackendConfig('true', 'redis://localhost:6379')).toEqual({ backend: 'redis', redisConnectionString: 'redis://localhost:6379' });
	});

	it('configures community creation by stable account class rather than domain role', () => {
		expect(policies).toEqual([
			{ feature: 'community.create', accountType: 'account', limit: 5, windowMs: 900_000 },
			{ feature: 'community.create', accountType: 'staff', limit: 20, windowMs: 900_000 },
		]);
		expect(policies.every((policy) => policy.staffRole === undefined)).toBe(true);
	});
});
