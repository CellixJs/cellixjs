import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverPortalConfigs } from '../src/portal-discovery.ts';

function makeTempAppsDir() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-oauth2-mock-tests-'));
	return dir;
}

function writeJson(dir: string, relPath: string, obj: unknown) {
	const p = path.join(dir, relPath);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf-8');
}

function writeEnv(dir: string, relPath: string, content: string) {
	const p = path.join(dir, relPath);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, content, 'utf-8');
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
			envVars: { clientId: 'CLIENT_A', redirectUri: 'REDIR_A' },
			claims: { sub: '1' },
		});

		writeEnv(tmp, 'ui-a/.env', 'CLIENT_A=cid-a\nREDIR_A=https://a/redirect\n');

		writeJson(tmp, 'ui-b/mock-oidc.json', {
			name: 'b',
			envVars: { clientId: 'CLIENT_B', redirectUri: 'REDIR_B' },
			claims: { sub: '2' },
		});
		writeEnv(tmp, 'ui-b/.env', 'CLIENT_B=cid-b\nREDIR_B=https://b/redirect\n');

		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(2);
		const names = portals.map((p) => p.name).sort();
		expect(names).toEqual(['a', 'b']);
	});

	it('shallow-merges mock-oidc.local.json claims overriding keys', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-x/mock-oidc.json', {
			name: 'x',
			envVars: { clientId: 'CIDX', redirectUri: 'REDIRX' },
			claims: { sub: 'orig', email: 'orig@example.com', extra: 'keep' },
		});
		writeEnv(tmp, 'ui-x/.env', 'CIDX=cid-x\nREDIRX=https://x/redirect\n');

		writeJson(tmp, 'ui-x/mock-oidc.local.json', {
			claims: { email: 'local@example.com', sub: 'local' },
		});

		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(1);
		const p = portals[0];
		expect(p.claims.sub).toBe('local');
		expect(p.claims.email).toBe('local@example.com');
		expect(p.claims.extra).toBe('keep');
	});

	it('warns and falls back to base config when mock-oidc.local.json is malformed', () => {
		if (!tmp) throw new Error('tmp not created');

		// Write valid base config
		writeJson(tmp, 'ui-bad-local/mock-oidc.json', {
			name: 'bad-local-test',
			envVars: { clientId: 'VITE_CLIENT_ID', redirectUri: 'VITE_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		fs.writeFileSync(path.join(tmp, 'ui-bad-local', '.env'), 'VITE_CLIENT_ID=cid\nVITE_REDIRECT_URI=https://r/cb\n');
		// Write malformed local override
		fs.writeFileSync(path.join(tmp, 'ui-bad-local', 'mock-oidc.local.json'), '{ invalid json }');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const portals = discoverPortalConfigs(tmp);
			expect(portals).toHaveLength(1);
			expect(portals[0].claims.sub).toBe('00000000-0000-4000-8000-000000000001');
			expect(warnSpy).toHaveBeenCalled();
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('returns portals sorted alphabetically by ui-* directory name', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-a/mock-oidc.json', {
			name: 'a',
			envVars: { clientId: 'A_C', redirectUri: 'A_R' },
			claims: { sub: '1' },
		});
		writeEnv(tmp, 'ui-a/.env', 'A_C=cid-a\nA_R=https://a/redirect\n');

		writeJson(tmp, 'ui-c/mock-oidc.json', {
			name: 'c',
			envVars: { clientId: 'C_C', redirectUri: 'C_R' },
			claims: { sub: '3' },
		});
		writeEnv(tmp, 'ui-c/.env', 'C_C=cid-c\nC_R=https://c/redirect\n');

		writeJson(tmp, 'ui-b/mock-oidc.json', {
			name: 'b',
			envVars: { clientId: 'B_C', redirectUri: 'B_R' },
			claims: { sub: '2' },
		});
		writeEnv(tmp, 'ui-b/.env', 'B_C=cid-b\nB_R=https://b/redirect\n');

		const portals = discoverPortalConfigs(tmp);
		const names = portals.map((p) => p.name);
		expect(names).toEqual(['a', 'b', 'c']);
	});

	it('skips invalid mock-oidc.json (missing required fields) with a warning', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-good/mock-oidc.json', {
			name: 'good',
			envVars: { clientId: 'G_C', redirectUri: 'G_R' },
			claims: { sub: 'g' },
		});
		writeEnv(tmp, 'ui-good/.env', 'G_C=cid-good\nG_R=https://good/redirect\n');

		// invalid: missing claims
		writeJson(tmp, 'ui-bad/mock-oidc.json', {
			name: 'bad',
			envVars: { clientId: 'B_C', redirectUri: 'B_R' },
			// claims omitted
		} as unknown as Record<string, unknown>);

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp);
		expect(portals.find((p) => p.name === 'good')).toBeDefined();
		expect(portals.find((p) => p.name === 'bad')).toBeUndefined();
		expect(warnSpy).toHaveBeenCalled();
	});

	it('skips portal when .env is missing with a warning', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-missing-env/mock-oidc.json', {
			name: 'missing-env',
			envVars: { clientId: 'M_C', redirectUri: 'M_R' },
			claims: { sub: 'm' },
		});

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	it('skips portal when env var is not present in .env with a warning', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-bad-env/mock-oidc.json', {
			name: 'bad-env',
			envVars: { clientId: 'X_C', redirectUri: 'X_R' },
			claims: { sub: 'x' },
		});
		writeEnv(tmp, 'ui-bad-env/.env', 'OTHER=1\n');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	it('skips malformed mock-oidc.json with a warning', () => {
		if (!tmp) throw new Error('tmp not created');

		const p = path.join(tmp, 'ui-bad/mock-oidc.json');
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, '{ invalid json', 'utf-8');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(0);
		expect(warnSpy).toHaveBeenCalled();
	});

	it('silently skips ui-* dirs without mock-oidc.json', () => {
		if (!tmp) throw new Error('tmp not created');

		fs.mkdirSync(path.join(tmp, 'ui-empty'));
		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(0);
	});

	it('preserves array-valued claims from mock-oidc.json', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-roles/mock-oidc.json', {
			name: 'roles-test',
			envVars: { clientId: 'VITE_CLIENT_ID', redirectUri: 'VITE_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001', roles: ['admin', 'editor'], level: 2 },
		});
		fs.writeFileSync(path.join(tmp, 'ui-roles', '.env'), 'VITE_CLIENT_ID=cid\nVITE_REDIRECT_URI=https://r/cb\n');

		const portals = discoverPortalConfigs(tmp);
		expect(portals).toHaveLength(1);
		expect(portals[0].claims.roles).toEqual(['admin', 'editor']);
		expect(portals[0].claims.level).toBe(2);
	});

	it('prefers .env.local values over .env when both exist', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-envlocal/mock-oidc.json', {
			name: 'envlocal-test',
			envVars: { clientId: 'VITE_CLIENT_ID', redirectUri: 'VITE_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		fs.writeFileSync(path.join(tmp, 'ui-envlocal', '.env'), 'VITE_CLIENT_ID=base-client-id\nVITE_REDIRECT_URI=https://base/cb\n');
		fs.writeFileSync(path.join(tmp, 'ui-envlocal', '.env.local'), 'VITE_CLIENT_ID=local-client-id\n');

		const portals = discoverPortalConfigs(tmp);
		const portal = portals.find((p) => p.name === 'envlocal-test');
		expect(portal).toBeDefined();
		expect(portal?.clientId).toBe('local-client-id');
	});

	it('discovers portal when only .env.local exists and .env is absent', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-localonly/mock-oidc.json', {
			name: 'localonly-test',
			envVars: { clientId: 'VITE_CLIENT_ID', redirectUri: 'VITE_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		// No .env file - only .env.local
		fs.writeFileSync(path.join(tmp, 'ui-localonly', '.env.local'), 'VITE_CLIENT_ID=localonly-client-id\nVITE_REDIRECT_URI=https://local/cb\n');

		const portals = discoverPortalConfigs(tmp);
		const portal = portals.find((p) => p.name === 'localonly-test');
		expect(portal).toBeDefined();
		expect(portal?.clientId).toBe('localonly-client-id');
	});

	it('skips portal and warns when reading .env throws', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-envthrow/mock-oidc.json', {
			name: 'envthrow-test',
			envVars: { clientId: 'VITE_CLIENT_ID', redirectUri: 'VITE_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		fs.mkdirSync(path.join(tmp, 'ui-envthrow', '.env'));

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		try {
			const portals = discoverPortalConfigs(tmp);
			const portal = portals.find((p) => p.name === 'envthrow-test');
			expect(portal).toBeUndefined();
			expect(warnSpy).toHaveBeenCalled();
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('returns empty array and warns when readdirSync throws', () => {
		if (!tmp) throw new Error('tmp not created');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		// Use a non-existent directory so fs.readdirSync will throw ENOENT
		const nonExistent = `${tmp}-no-such-dir`;
		try {
			const portals = discoverPortalConfigs(nonExistent);
			expect(portals).toEqual([]);
			expect(warnSpy).toHaveBeenCalled();
		} finally {
			warnSpy.mockRestore();
		}
	});
});
