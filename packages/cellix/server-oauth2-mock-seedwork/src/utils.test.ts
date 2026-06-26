import { describe, expect, it } from 'vitest';
import { ensurePortInUrl, normalizeBaseUrl, normalizeOrigin, normalizeUrl, SAFE_NAME_RE } from './index.ts';

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

describe('ensurePortInUrl preserves all URL components', () => {
	it('preserves username and password when injecting port', () => {
		const original = 'https://user:pass@example.local/path?query=1#fragment';
		const result = ensurePortInUrl(original, 1355);
		const parsed = new URL(result);
		expect(parsed.username).toBe('user');
		expect(parsed.password).toBe('pass');
		expect(parsed.pathname).toBe('/path');
		expect(parsed.search).toBe('?query=1');
		expect(parsed.hash).toBe('#fragment');
		expect(parsed.port).toBe('1355');
	});

	it('preserves hash, search and pathname', () => {
		const original = 'https://example.local/some/path?x=1#top';
		const result = ensurePortInUrl(original, 1355);
		const parsed = new URL(result);
		expect(parsed.pathname).toBe('/some/path');
		expect(parsed.search).toBe('?x=1');
		expect(parsed.hash).toBe('#top');
		expect(parsed.port).toBe('1355');
	});

	it('does not modify when port already present', () => {
		const original = 'https://example.local:8080/path?x=1#h';
		const result = ensurePortInUrl(original, 1355);
		const parsed = new URL(result);
		expect(parsed.port).toBe('8080');
		expect(parsed.port).not.toBe('1355');
	});

	it('does not add port 443 for https (protocol default)', () => {
		const original = 'https://secure.example.local/path?x=1#h';
		const result = ensurePortInUrl(original, 443);
		const parsed = new URL(result);
		expect(parsed.port).toBe('');
	});

	it('does add port 443 for http (not the http default)', () => {
		const original = 'http://example.local/path';
		const result = ensurePortInUrl(original, 443);
		const parsed = new URL(result);
		expect(parsed.port).toBe('443');
	});

	it('does not add port 80 for http (protocol default)', () => {
		const original = 'http://example.local/path';
		const result = ensurePortInUrl(original, 80);
		const parsed = new URL(result);
		expect(parsed.port).toBe('');
	});

	it('does add port 80 for https (not the https default)', () => {
		const original = 'https://example.local/path';
		const result = ensurePortInUrl(original, 80);
		const parsed = new URL(result);
		expect(parsed.port).toBe('80');
	});

	it('supports IPv6 hostnames', () => {
		const original = 'https://[::1]/path?x=1#h';
		const result = ensurePortInUrl(original, 1355);
		const parsed = new URL(result);
		// Extract bare IPv6 address by removing brackets if present
		const hostname = parsed.hostname.replaceAll(/^\[|\]$/g, '');
		expect(hostname).toBe('::1');
		expect(parsed.port).toBe('1355');
		expect(parsed.pathname).toBe('/path');
	});
});
