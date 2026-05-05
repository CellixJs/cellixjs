import { describe, expect, it } from 'vitest';
import { createSplitLink } from './index';

describe('createSplitLink (basic)', () => {
	it('is exported and is a function', () => {
		expect(typeof createSplitLink).toBe('function');
	});
});
