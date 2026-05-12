import { describe, expect, it } from 'vitest';

import { createRetryPolicy } from './index.ts';

describe('createRetryPolicy', () => {
	it('builds a deterministic schedule', () => {
		expect(createRetryPolicy({ attempts: 3, baseDelayMs: 100 })).toEqual({
			attempts: 3,
			delays: [100, 200, 400],
		});
	});
});
