import { describe, expect, it } from 'vitest';
import { policies } from './index.ts';

describe('rate-limiting policy configuration', () => {
	it('keeps application-specific actor selection in configuration', () => {
		expect(policies).toEqual([
			{ feature: 'community.create', criteria: { actorType: 'account' }, limit: 5, windowMs: 900_000 },
			{ feature: 'community.create', criteria: { actorType: 'staff' }, limit: 20, windowMs: 900_000 },
		]);
	});
});
