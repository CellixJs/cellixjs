import { describe, expect, it } from 'vitest';
import { normalizeBaseUrl, normalizeOrigin, normalizeUrl, SAFE_NAME_RE } from './index.ts';

describe('normalizeUrl', () => {
	it('trims trailing slash and sorts query params', () => {
		expect(normalizeUrl('https://example.com/foo/')).toBe('https://example.com/foo');
		expect(normalizeUrl('https://example.com?b=2&a=1')).toBe('https://example.com/?a=1&b=2');
	});
});

describe('normalizeOrigin', () => {
	it('returns origin only', () => {
		expect(normalizeOrigin('https://example.com/path')).toBe('https://example.com');
	});
});

describe('normalizeBaseUrl', () => {
	it('removes trailing slash', () => {
		expect(normalizeBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000');
	});
});

describe('SAFE_NAME_RE', () => {
	it('accepts valid names and rejects invalid ones', () => {
		expect(SAFE_NAME_RE.test('abc-123_')).toBe(true);
		expect(SAFE_NAME_RE.test('bad/name')).toBe(false);
	});
});
