import { describe, expect, it } from 'vitest';

import { createCommandRouter } from './index.ts';
import { buildRouteKey } from './internal/build-route-key.ts';

describe('createCommandRouter', () => {
	it('dispatches registered commands', () => {
		const router = createCommandRouter();
		router.register('Build Report', () => 'ok');

		expect(router.dispatch('Build Report')).toBe('ok');
	});

	it('shares the same normalization rule as the internal helper', () => {
		expect(buildRouteKey('Build Report')).toBe('build-report');
	});
});
