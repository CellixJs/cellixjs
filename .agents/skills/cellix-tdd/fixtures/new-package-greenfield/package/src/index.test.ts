import { describe, expect, it } from 'vitest';

import { slugify } from './index.ts';

describe('slugify', () => {
	it('normalizes punctuation and casing', () => {
		expect(slugify('Hello, CellixJS!')).toBe('hello-cellixjs');
	});

	it('supports underscore separators', () => {
		expect(slugify('Hello, CellixJS!', { separator: '_' })).toBe('hello_cellixjs');
	});
});
