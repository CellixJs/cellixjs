import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFileSessionStore, toStoredSession } from './session.ts';

describe('createFileSessionStore', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'encoder-session-'));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	it('saves, loads, and clears a session in a file only the user can read', async () => {
		const filePath = join(dir, 'nested', 'session.json');
		const store = createFileSessionStore(filePath);
		const session = toStoredSession('https://issuer', 'client', { accessToken: 'a', expiresAt: new Date('2026-10-05T12:00:00Z'), refreshToken: 'r', claims: { name: 'Tia' } });

		await store.save(session);

		expect(await store.load()).toEqual({ issuer: 'https://issuer', clientId: 'client', accessToken: 'a', expiresAt: '2026-10-05T12:00:00.000Z', refreshToken: 'r', claims: { name: 'Tia' } });
		expect((await stat(filePath)).mode & 0o777).toBe(0o600);
		await store.clear();
		expect(await store.load()).toBeUndefined();
	});

	it('loads nothing when there is no saved session', async () => {
		expect(await createFileSessionStore(join(dir, 'missing.json')).load()).toBeUndefined();
	});
});

describe('toStoredSession', () => {
	it('omits the refresh token when there is none', () => {
		expect(toStoredSession('i', 'c', { accessToken: 'a', expiresAt: new Date(0), claims: {} })).not.toHaveProperty('refreshToken');
	});
});
