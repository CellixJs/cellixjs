import { describe, expect, it } from 'vitest';

import { parseBooleanFlag, parseStringList } from './index.ts';

describe('parseBooleanFlag', () => {
	it('accepts affirmative tokens', () => {
		expect(parseBooleanFlag('yes')).toBe(true);
	});

	it('rejects unknown boolean text', () => {
		expect(() => parseBooleanFlag('sometimes')).toThrow(TypeError);
	});
});

describe('parseStringList', () => {
	it('splits and trims items', () => {
		expect(parseStringList('alpha, beta')).toEqual(['alpha', 'beta']);
	});
});
