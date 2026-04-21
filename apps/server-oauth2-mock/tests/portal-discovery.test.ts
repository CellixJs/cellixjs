import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverPortalConfigs, type PortalOidcConfig } from '../src/setup-environment.js';

function makeTempAppsDir() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-oauth2-mock-tests-'));
	return dir;
}

function writeJson(dir: string, relPath: string, obj: unknown) {
	const p = path.join(dir, relPath);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf-8');
}

describe('discoverPortalConfigs', () => {
	let tmp: string | null = null;

	beforeEach(() => {
		tmp = makeTempAppsDir();
	});

	afterEach(() => {
		if (tmp && fs.existsSync(tmp)) {
			fs.rmSync(tmp, { recursive: true, force: true });
		}
		tmp = null;
		vi.restoreAllMocks();
	});

	it('finds mock-oidc.json in ui-* dirs and returns PortalOidcConfig[]', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-a/mock-oidc.json', {
			name: 'a',
			baseUrl: 'https://a',
			clientId: 'cid-a',
			redirectUri: 'https://a/redirect',
			claims: { sub: '1' },
		});

		writeJson(tmp, 'ui-b/mock-oidc.json', {
			name: 'b',
			baseUrl: 'https://b',
			clientId: 'cid-b',
			redirectUri: 'https://b/redirect',
			claims: { sub: '2' },
		});

		const portals = discoverPortalConfigs(tmp, 4000);
		expect(portals.length).toBe(2);
		const names = portals.map((p) => p.name).sort();
		expect(names).toEqual(['a', 'b']);
	});

	it('shallow-merges mock-oidc.local.json claims overriding keys', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-x/mock-oidc.json', {
			name: 'x',
			baseUrl: 'https://x',
			clientId: 'cid-x',
			redirectUri: 'https://x/redirect',
			claims: { sub: 'orig', email: 'orig@example.com', extra: 'keep' },
		});

		writeJson(tmp, 'ui-x/mock-oidc.local.json', {
			claims: { email: 'local@example.com', sub: 'local' },
		});

		const portals = discoverPortalConfigs(tmp, 5000);
		expect(portals.length).toBe(1);
		const p = portals[0];
		expect(p.claims.sub).toBe('local');
		expect(p.claims.email).toBe('local@example.com');
		expect(p.claims.extra).toBe('keep');
	});

	it('assigns ports sequentially starting from portBase (sorted by dir name)', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-a/mock-oidc.json', {
			name: 'a',
			baseUrl: 'https://a',
			clientId: 'cid-a',
			redirectUri: 'https://a/redirect',
			claims: { sub: '1' },
		});
		writeJson(tmp, 'ui-c/mock-oidc.json', {
			name: 'c',
			baseUrl: 'https://c',
			clientId: 'cid-c',
			redirectUri: 'https://c/redirect',
			claims: { sub: '3' },
		});
		writeJson(tmp, 'ui-b/mock-oidc.json', {
			name: 'b',
			baseUrl: 'https://b',
			clientId: 'cid-b',
			redirectUri: 'https://b/redirect',
			claims: { sub: '2' },
		});

		const portals = discoverPortalConfigs(tmp, 6000);
		// directories sorted: ui-a, ui-b, ui-c
		const ports = portals.map((p) => p.port);
		expect(ports).toEqual([6000, 6001, 6002]);
	});

	it('skips invalid mock-oidc.json (missing required fields) with a warning', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-good/mock-oidc.json', {
			name: 'good',
			baseUrl: 'https://good',
			clientId: 'cid-good',
			redirectUri: 'https://good/redirect',
			claims: { sub: 'g' },
		});

		// invalid: missing claims
		writeJson(tmp, 'ui-bad/mock-oidc.json', {
			name: 'bad',
			baseUrl: 'https://bad',
			clientId: 'cid-bad',
			redirectUri: 'https://bad/redirect',
			// claims omitted
		} as unknown as Record<string, unknown>);

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp, 7000);
		expect(portals.find((p) => p.name === 'good')).toBeDefined();
		expect(portals.find((p) => p.name === 'bad')).toBeUndefined();
		expect(warnSpy).toHaveBeenCalled();
	});

	it('silently skips ui-* dirs without mock-oidc.json', () => {
		if (!tmp) throw new Error('tmp not created');

		fs.mkdirSync(path.join(tmp, 'ui-empty'));
		const portals = discoverPortalConfigs(tmp, 8000);
		expect(portals.length).toBe(0);
	});
});
