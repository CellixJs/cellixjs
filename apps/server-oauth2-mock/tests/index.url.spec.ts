import { describe, expect, it } from 'vitest';
import { ensurePortInUrl } from '../src/utils.ts';

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

	it('does not add port for default 443', () => {
		const original = 'https://secure.example.local/path?x=1#h';
		const result = ensurePortInUrl(original, 443);
		const parsed = new URL(result);
		expect(parsed.port).toBe('');
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
