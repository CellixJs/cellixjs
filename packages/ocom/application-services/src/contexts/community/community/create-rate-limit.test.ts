import { describe, expect, it, vi } from 'vitest';
import { create } from './create.ts';

describe('community.create rate limiting', () => {
	it('does not execute the action when the request is denied', async () => {
		const getByExternalId = vi.fn();
		const rateLimitingService = {
			consume: vi.fn().mockResolvedValue({
				allowed: false,
				feature: 'community.create',
				accountType: 'account',
				limit: 5,
				remaining: 0,
				resetAt: new Date('2026-08-04T15:00:00.000Z'),
				retryAfterMs: 1_000,
			}),
		};
		const action = create(
			{
				readonlyDataSource: { User: { EndUser: { EndUserReadRepo: { getByExternalId } } } },
			} as never,
			{} as never,
			{} as never,
			rateLimitingService,
			{ id: 'account-1', accountType: 'account' },
		);

		await expect(action({ name: 'Example', endUserExternalId: 'external-user' })).rejects.toThrow('Rate limit exceeded for feature community.create');
		expect(rateLimitingService.consume).toHaveBeenCalledWith({
			feature: 'community.create',
			subject: { id: 'account-1', accountType: 'account' },
		});
		expect(getByExternalId).not.toHaveBeenCalled();
	});
});
