import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverPortalConfigs } from '../src/portal-discovery.ts';

function makeTempAppsDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'server-oauth2-mock-tests-'));
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
		const names = portals.map((p) => p.name).sort((a, b) => a.localeCompare(b));
		expect(names).toEqual(['a-a', 'b-b']);
	});

	it('supports multi-config mock-oidc.json arrays and resolves envs per element', () => {
		if (!tmp) throw new Error('tmp not created');

		// Single ui dir with multiple configs
		writeJson(tmp, 'ui-community/mock-oidc.json', [
			{
				name: 'end-user',
				envVars: { clientId: 'VITE_APP_COMMUNITY_END_CLIENTID', redirectUri: 'VITE_APP_COMMUNITY_END_REDIRECT' },
				claims: { sub: 'end' },
			},
			{
				name: 'staff-user',
				envVars: { clientId: 'VITE_APP_COMMUNITY_STAFF_CLIENTID', redirectUri: 'VITE_APP_COMMUNITY_STAFF_REDIRECT' },
				claims: { sub: 'staff' },
			},
		]);

		// Provide env entries for both configs
		writeEnv(
			tmp,
			'ui-community/.env',
			'VITE_APP_COMMUNITY_END_CLIENTID=end-cid\nVITE_APP_COMMUNITY_END_REDIRECT=https://community/end/cb\nVITE_APP_COMMUNITY_STAFF_CLIENTID=staff-cid\nVITE_APP_COMMUNITY_STAFF_REDIRECT=https://community/staff/cb\n',
		);

		const portals = discoverPortalConfigs(tmp);
		expect(portals.length).toBe(2);

		// registration names: (dir minus ui-) + '-' + config.name
		const regNames = portals.map((p) => p.name).sort();
		expect(regNames).toEqual(['community-end-user', 'community-staff-user']);

		const end = portals.find((p) => p.name === 'community-end-user');
		const staff = portals.find((p) => p.name === 'community-staff-user');
		expect(end).toBeDefined();
		expect(staff).toBeDefined();
		expect(end?.clientId).toBe('end-cid');
		expect(end?.redirectUri).toBe('https://community/end/cb');
		expect(staff?.clientId).toBe('staff-cid');
		expect(staff?.redirectUri).toBe('https://community/staff/cb');
	});

	it('skips invalid mock-oidc.local.json and keeps base claims unchanged', () => {
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
		// biome-ignore lint:useLiteralKeys
		expect(p?.claims?.['sub']).toBe('orig');
		// biome-ignore lint:useLiteralKeys
		expect(p?.claims?.['email']).toBe('orig@example.com');
		// biome-ignore lint:useLiteralKeys
		expect(p?.claims?.['extra']).toBe('keep');
	});

	it('does not warn for malformed mock-oidc.local.json because it is ignored', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-bad-local/mock-oidc.json', {
			name: 'bad-local-test',
			envVars: { clientId: 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID', redirectUri: 'VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		fs.writeFileSync(path.join(tmp, 'ui-bad-local', '.env'), 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID=cid\nVITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI=https://r/cb\n');
		fs.writeFileSync(path.join(tmp, 'ui-bad-local', 'mock-oidc.local.json'), '{ invalid json }');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const portals = discoverPortalConfigs(tmp);
			expect(portals).toHaveLength(1);
			// biome-ignore lint:useLiteralKeys
			expect(portals[0]?.claims?.['sub']).toBe('00000000-0000-4000-8000-000000000001');
			expect(warnSpy).not.toHaveBeenCalled();
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
		expect(names).toEqual(['a-a', 'b-b', 'c-c']);
	});

	it('skips invalid mock-oidc.json (missing required fields) with a warning', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-good/mock-oidc.json', {
			name: 'good',
			envVars: { clientId: 'G_C', redirectUri: 'G_R' },
			claims: { sub: 'g' },
		});
		writeEnv(tmp, 'ui-good/.env', 'G_C=cid-good\nG_R=https://good/redirect\n');

		// invalid: missing envVars
		writeJson(tmp, 'ui-bad/mock-oidc.json', {
			name: 'bad',
		} as unknown as Record<string, unknown>);

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp);
		expect(portals.find((p) => p.name === 'good-good')).toBeDefined();
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

	it('skips portals when claims is null or an array', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-valid/mock-oidc.json', {
			name: 'valid',
			envVars: { clientId: 'VALID_CLIENT_ID', redirectUri: 'VALID_REDIRECT_URI' },
			claims: { sub: 'valid-sub' },
		});
		writeEnv(tmp, 'ui-valid/.env', 'VALID_CLIENT_ID=cid-valid\nVALID_REDIRECT_URI=https://valid/redirect\n');

		writeJson(tmp, 'ui-null/mock-oidc.json', {
			name: 'null-claims',
			envVars: { clientId: 'NULL_CLIENT_ID', redirectUri: 'NULL_REDIRECT_URI' },
			claims: null,
		});
		writeEnv(tmp, 'ui-null/.env', 'NULL_CLIENT_ID=cid-null\nNULL_REDIRECT_URI=https://null/redirect\n');

		writeJson(tmp, 'ui-array/mock-oidc.json', {
			name: 'array-claims',
			envVars: { clientId: 'ARRAY_CLIENT_ID', redirectUri: 'ARRAY_REDIRECT_URI' },
			claims: ['admin'],
		});
		writeEnv(tmp, 'ui-array/.env', 'ARRAY_CLIENT_ID=cid-array\nARRAY_REDIRECT_URI=https://array/redirect\n');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const portals = discoverPortalConfigs(tmp);
		expect(portals).toHaveLength(1);
		expect(portals[0]?.dirName).toBe('ui-valid');
		expect(warnSpy).toHaveBeenCalledTimes(3);
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
			envVars: { clientId: 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID', redirectUri: 'VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001', roles: ['admin', 'editor'], level: 2 },
		});
		fs.writeFileSync(path.join(tmp, 'ui-roles', '.env'), 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID=cid\nVITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI=https://r/cb\n');

		const portals = discoverPortalConfigs(tmp);
		expect(portals).toHaveLength(1);
		// biome-ignore lint:useLiteralKeys
		expect(portals[0]?.claims?.['roles']).toEqual(['admin', 'editor']);
		// biome-ignore lint:useLiteralKeys
		expect(portals[0]?.claims?.['level']).toBe(2);
	});

	it('prefers .env.local values over .env when both exist', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-envlocal/mock-oidc.json', {
			name: 'envlocal-test',
			envVars: { clientId: 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID', redirectUri: 'VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		fs.writeFileSync(path.join(tmp, 'ui-envlocal', '.env'), 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID=base-client-id\nVITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI=https://base/cb\n');
		fs.writeFileSync(path.join(tmp, 'ui-envlocal', '.env.local'), 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID=local-client-id\n');

		const portals = discoverPortalConfigs(tmp);
		const portal = portals.find((p) => p.dirName === 'ui-envlocal');
		expect(portal).toBeDefined();
		expect(portal?.clientId).toBe('local-client-id');
	});

	it('discovers portal when only .env.local exists and .env is absent', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-localonly/mock-oidc.json', {
			name: 'localonly-test',
			envVars: { clientId: 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID', redirectUri: 'VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		// No .env file - only .env.local
		fs.writeFileSync(path.join(tmp, 'ui-localonly', '.env.local'), 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID=localonly-client-id\nVITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI=https://local/cb\n');

		const portals = discoverPortalConfigs(tmp);
		const portal = portals.find((p) => p.dirName === 'ui-localonly');
		expect(portal).toBeDefined();
		expect(portal?.clientId).toBe('localonly-client-id');
	});

	it('skips portal and warns when reading .env throws', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-envthrow/mock-oidc.json', {
			name: 'envthrow-test',
			envVars: { clientId: 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID', redirectUri: 'VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI' },
			claims: { sub: '00000000-0000-4000-8000-000000000001' },
		});
		fs.mkdirSync(path.join(tmp, 'ui-envthrow', '.env'));

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		try {
			const portals = discoverPortalConfigs(tmp);
			const portal = portals.find((p) => p.dirName === 'ui-envthrow');
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

	it('returns a portal with dirName set to the directory name', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-example/mock-oidc.json', {
			name: 'example',
			envVars: { clientId: 'CIDX_EX', redirectUri: 'REDIR_EX' },
			claims: { sub: 'example-sub' },
		});
		writeEnv(tmp, 'ui-example/.env', 'CIDX_EX=client-example\nREDIR_EX=https://example.localhost/redirect\n');

		const portals = discoverPortalConfigs(tmp);
		expect(portals).toHaveLength(1);
		expect(portals[0]?.dirName).toBe('ui-example');
	});

	it('keeps claims undefined when mock-oidc.json omits the claims field', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-noclaims/mock-oidc.json', {
			name: 'noclaims',
			envVars: { clientId: 'CIDX_NC', redirectUri: 'REDIR_NC' },
		});
		writeEnv(tmp, 'ui-noclaims/.env', 'CIDX_NC=client-noclaims\nREDIR_NC=https://noclaims.localhost/redirect\n');

		const portals = discoverPortalConfigs(tmp);
		const portal = portals.find((config) => config.dirName === 'ui-noclaims');
		expect(portal).toBeDefined();
		expect(portal?.claims).toBeUndefined();
	});

	it('skips duplicate computed registration names and warns, keeping the first', () => {
		if (!tmp) throw new Error('tmp not created');

		// Two different ui directories whose computed registrationName will collide:
		// ui-community with config.name 'end-user' -> 'community-end-user'
		// ui-community-end with config.name 'user' -> 'community-end-user'
		writeJson(tmp, 'ui-community/mock-oidc.json', {
			name: 'end-user',
			envVars: { clientId: 'C_END_CID', redirectUri: 'C_END_RED' },
			claims: { sub: 'one' },
		});
		writeEnv(tmp, 'ui-community/.env', 'C_END_CID=end-1\nC_END_RED=https://end/1\n');

		writeJson(tmp, 'ui-community-end/mock-oidc.json', {
			name: 'user',
			envVars: { clientId: 'C_USER_CID', redirectUri: 'C_USER_RED' },
			claims: { sub: 'two' },
		});
		writeEnv(tmp, 'ui-community-end/.env', 'C_USER_CID=end-2\nC_USER_RED=https://end/2\n');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const portals = discoverPortalConfigs(tmp);
			// Only the first (ui-community) should be kept
			expect(portals.find((p) => p.name === 'community-end-user')).toBeDefined();
			expect(portals.find((p) => p.dirName === 'ui-community-end')).toBeUndefined();
			expect(warnSpy).toHaveBeenCalled();
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('skips configs whose computed registrationName fails SAFE_NAME_RE and warns', () => {
		if (!tmp) throw new Error('tmp not created');

		// Create a config.name that will produce an invalid registrationName (contains space)
		writeJson(tmp, 'ui-badname/mock-oidc.json', {
			name: 'bad name',
			envVars: { clientId: 'BAD_CID', redirectUri: 'BAD_RED' },
			claims: { sub: 'bad' },
		});
		writeEnv(tmp, 'ui-badname/.env', 'BAD_CID=cid-bad\nBAD_RED=https://bad/redirect\n');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const portals = discoverPortalConfigs(tmp);
			// Should be skipped
			expect(portals.find((p) => p.dirName === 'ui-badname')).toBeUndefined();
			expect(warnSpy).toHaveBeenCalled();
			// Ensure the warning references "invalid computed registration name" or the bad name
			const called = warnSpy.mock.calls.some((args) => args[0] && String(args[0]).includes('invalid computed registration name'));
			expect(called).toBe(true);
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('warns for non-conforming env var names but still resolves them', () => {
		if (!tmp) throw new Error('tmp not created');

		writeJson(tmp, 'ui-nonconform/mock-oidc.json', {
			name: 'nc',
			envVars: { clientId: 'CLIENT_NC', redirectUri: 'REDIR_NC' },
			claims: { sub: 'nc' },
		});
		writeEnv(tmp, 'ui-nonconform/.env', 'CLIENT_NC=cid-nc\nREDIR_NC=https://nc/redirect\n');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const portals = discoverPortalConfigs(tmp);
			expect(portals).toHaveLength(1);
			expect(warnSpy).toHaveBeenCalled();
			const p = portals[0];
			expect(p?.clientId).toBe('cid-nc');
		} finally {
			warnSpy.mockRestore();
		}
	});
});
