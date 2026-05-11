import { describe, expect, it } from 'vitest';
import { buildLoginHtml, buildSignupHtml } from './html-builders.ts';

describe('buildLoginHtml', () => {
	const issuerBaseUrl = 'https://issuer.example';
	const nonce = 'abc123';

	it('returns a string containing <form', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce });

		expect(html).toContain('<form');
	});

	it('includes the nonce in the form action URL', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce });

		expect(html).toContain(`action="${issuerBaseUrl}/login?nonce=${nonce}"`);
		expect(html).toContain('nonce=');
	});

	it('pre-fills the username when provided', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce, username: 'alice' });

		expect(html).toContain('name="username" value="alice"');
	});

	it('includes the error message when provided', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce, error: 'Invalid credentials' });

		expect(html).toContain('Invalid credentials');
	});

	it('HTML-escapes the username', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce, username: '<script>' });

		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	it('HTML-escapes the error', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce, error: '<b>bad</b>' });

		expect(html).toContain('&lt;b&gt;bad&lt;/b&gt;');
		expect(html).not.toContain('<b>bad</b>');
	});

	it('escapes nonce values in form markup', () => {
		const html = buildLoginHtml({ issuerBaseUrl, nonce: 'bad"?><script>alert(1)</script>' });

		expect(html).toContain('nonce=bad%22%3F%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E');
		expect(html).toContain('name="nonce" value="bad&quot;?&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
		expect(html).not.toContain('nonce=bad"?><script>alert(1)</script>');
	});
});

describe('buildSignupHtml', () => {
	const issuerBaseUrl = 'https://issuer.example';
	const nonce = 'abc123';

	it('returns a string containing <form', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce });

		expect(html).toContain('<form');
	});

	it('includes the nonce in the form action URL', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce });

		expect(html).toContain(`action="${issuerBaseUrl}/signup?nonce=${nonce}"`);
		expect(html).toContain('nonce=');
	});

	it('pre-fills the username when provided', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce, username: 'alice' });

		expect(html).toContain('name="username" value="alice"');
	});

	it('includes the error message when provided', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce, error: 'Username already exists' });

		expect(html).toContain('Username already exists');
	});

	it('HTML-escapes the username', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce, username: '<script>' });

		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	it('HTML-escapes the error', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce, error: '<b>bad</b>' });

		expect(html).toContain('&lt;b&gt;bad&lt;/b&gt;');
		expect(html).not.toContain('<b>bad</b>');
	});

	it('escapes nonce values in form markup', () => {
		const html = buildSignupHtml({ issuerBaseUrl, nonce: 'bad"?><script>alert(1)</script>' });

		expect(html).toContain('nonce=bad%22%3F%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E');
		expect(html).toContain('name="nonce" value="bad&quot;?&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
		expect(html).not.toContain('nonce=bad"?><script>alert(1)</script>');
	});
});
