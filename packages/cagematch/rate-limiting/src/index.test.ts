import { describe, expect, it, vi } from 'vitest';
import { ServiceRateLimiting, createRateLimitKey, createRateLimitingService, resolveRateLimitPolicy, type RateLimitPolicy, type RateLimitStore, type RateLimitStoreRequest } from './index.ts';

describe('resolveRateLimitPolicy', () => {
	const featurePolicy = { feature: 'community.create', limit: 5, windowMs: 60_000 } as const;
	const accountPolicy = { feature: 'community.create', accountType: 'account', limit: 10, windowMs: 60_000 } as const;
	const staffPolicy = { feature: 'community.create', accountType: 'staff', limit: 20, windowMs: 60_000 } as const;
	const staffRolePolicy = { feature: 'community.create', accountType: 'staff', staffRole: 'Default.TechAdmin', limit: 30, windowMs: 60_000 } as const;

	it('uses a feature policy as the default for every account type', () => {
		expect(resolveRateLimitPolicy([featurePolicy], 'community.create', { id: 'account-1', accountType: 'account' })).toEqual(featurePolicy);
		expect(resolveRateLimitPolicy([featurePolicy], 'community.create', { id: 'staff-1', accountType: 'staff' })).toEqual(featurePolicy);
	});

	it('prefers account type and then staff role overrides regardless of declaration order', () => {
		const policies: readonly RateLimitPolicy[] = [staffRolePolicy, accountPolicy, featurePolicy, staffPolicy];

		expect(resolveRateLimitPolicy(policies, 'community.create', { id: 'account-1', accountType: 'account' })).toEqual(accountPolicy);
		expect(resolveRateLimitPolicy(policies, 'community.create', { id: 'staff-1', accountType: 'staff', staffRole: 'Default.TechAdmin' })).toEqual(staffRolePolicy);
		expect(resolveRateLimitPolicy(policies, 'community.create', { id: 'staff-2', accountType: 'staff', staffRole: 'Default.CaseManager' })).toEqual(staffPolicy);
	});

	it('does not use tenant-defined account roles as policy selectors', () => {
		expect(resolveRateLimitPolicy([featurePolicy, accountPolicy], 'community.create', { id: 'account-1', accountType: 'account' })).toEqual(accountPolicy);
	});
});

describe('createRateLimitingService', () => {
	const policy = { feature: 'community.create', accountType: 'account', limit: 2, windowMs: 60_000 } as const;

	it('allows features without a configured policy without calling the store', async () => {
		const store = unusedStore();
		const service = createRateLimitingService(store, []);

		expect(await service.consume({ feature: 'community.read', subject: { id: 'user-1', accountType: 'account' } })).toEqual({
			allowed: true,
			feature: 'community.read',
			accountType: 'account',
			limit: null,
			remaining: null,
			resetAt: null,
			retryAfterMs: null,
		});
		expect(store.consume).not.toHaveBeenCalled();
	});

	it('passes the selected policy and isolated subject/feature key to the backend', async () => {
		let storeRequest: RateLimitStoreRequest | undefined;
		const store: RateLimitStore = {
			consume(request) {
				storeRequest = request;
				return Promise.resolve({ allowed: true, remaining: 1, resetAt: new Date('2026-08-04T15:00:00.000Z') });
			},
		};
		const service = createRateLimitingService(store, [policy]);
		const now = new Date('2026-08-04T14:30:00.000Z');
		const request = {
			feature: 'community.create',
			subject: { tenantId: 'community-1', id: 'user/1', accountType: 'account' as const },
			now,
		};

		const decision = await service.consume(request);

		expect(storeRequest).toEqual({
			key: createRateLimitKey(request, now.getTime()),
			limit: 2,
			windowMs: 60_000,
			cost: 1,
			now,
		});
		expect(createRateLimitKey(request, now.getTime())).toContain(':account:user%2F1:community.create:');
		expect(decision).toMatchObject({ allowed: true, feature: 'community.create', accountType: 'account', remaining: 1 });
	});

	it('returns retry information when the backend denies a feature', async () => {
		const resetAt = new Date('2026-08-04T14:31:00.000Z');
		const service = createRateLimitingService({ consume: async () => ({ allowed: false, remaining: 0, resetAt }) }, [policy]);

		const decision = await service.consume({
			feature: 'community.create',
			subject: { id: 'user-1', accountType: 'account' },
			now: new Date('2026-08-04T14:30:00.000Z'),
		});

		expect(decision.allowed).toBe(false);
		expect(decision.retryAfterMs).toBe(60_000);
	});

	it('rejects duplicate selectors and staff roles on non-staff policies at construction', () => {
		expect(() => createRateLimitingService(unusedStore(), [policy, { ...policy, limit: 3 }])).toThrow('Duplicate rate-limit policy selector');
		expect(() => createRateLimitingService(unusedStore(), [{ feature: 'community.create', accountType: 'account', staffRole: 'Default.TechAdmin', limit: 2, windowMs: 60_000 }])).toThrow('staffRole requires accountType "staff"');
	});

	it('rejects an invalid configured cost at construction', () => {
		expect(() => createRateLimitingService(unusedStore(), [{ ...policy, cost: 0 }])).toThrow('cost must be an integer between 1 and 2');
		expect(() => createRateLimitingService(unusedStore(), [{ ...policy, cost: 3 }])).toThrow('cost must be an integer between 1 and 2');
	});
});

describe('ServiceRateLimiting', () => {
	it('owns lifecycle and delegates to the selected implementation', async () => {
		const implementation = {
			startUp: vi.fn(async () => undefined),
			shutDown: vi.fn(async () => undefined),
			consume: vi.fn(async () => ({
				allowed: true,
				feature: 'community.read',
				accountType: 'account' as const,
				limit: null,
				remaining: null,
				resetAt: null,
				retryAfterMs: null,
			})),
		};
		const facade = new ServiceRateLimiting(implementation);
		const request = { feature: 'community.read', subject: { id: 'user-1', accountType: 'account' as const } };

		await expect(facade.consume(request)).rejects.toThrow('not started');
		await facade.startUp();
		expect(await facade.consume(request)).toMatchObject({ allowed: true });
		await facade.shutDown();
		await expect(facade.consume(request)).rejects.toThrow('not started');
		expect(implementation.startUp).toHaveBeenCalledOnce();
		expect(implementation.shutDown).toHaveBeenCalledOnce();
	});
});

function unusedStore(): RateLimitStore & { consume: ReturnType<typeof vi.fn> } {
	return { consume: vi.fn(async () => ({ allowed: true, remaining: 0, resetAt: new Date() })) };
}
