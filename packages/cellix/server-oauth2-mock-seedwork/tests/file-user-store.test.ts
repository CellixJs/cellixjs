import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFileUserStore } from '../src/index.ts';

function makeTempDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'server-oauth2-mock-users-'));
}

function writeUsers(dir: string, filename: string, users: unknown[]) {
	fs.writeFileSync(path.join(dir, filename), JSON.stringify(users, null, 2), 'utf-8');
}

describe('file user store concurrency', () => {
	let tmp: string | null = null;
	beforeEach(() => {
		tmp = makeTempDir();
	});
	afterEach(() => {
		if (tmp && fs.existsSync(tmp)) {
			fs.rmSync(tmp, { recursive: true, force: true });
		}
		tmp = null;
	});

	it('addUser completes and persists overlay (no deadlock)', async () => {
		if (!tmp) throw new Error('tmp not created');
		const store = createFileUserStore(tmp);
		await store.addUser({ username: 'alice', sub: 'sub-alice', password: 'pw' });
		const users = await store.listUsers();
		expect(users.find((u) => u.username === 'alice')).toBeDefined();
	});

	it('concurrent addUser and persist both complete', async () => {
		if (!tmp) throw new Error('tmp not created');
		const store = createFileUserStore(tmp);
		const addPromise = store.addUser({ username: 'bob', sub: 'sub-bob' });
		const persistPromise = store.persist ? store.persist() : Promise.resolve();
		await Promise.all([addPromise, persistPromise]);
		const users = await store.listUsers();
		expect(users.find((u) => u.username === 'bob')).toBeDefined();
	});
});

describe('file user store oidcConfigName filtering', () => {
	let tmp: string | null = null;
	beforeEach(() => {
		tmp = makeTempDir();
	});
	afterEach(() => {
		if (tmp && fs.existsSync(tmp)) {
			fs.rmSync(tmp, { recursive: true, force: true });
		}
		tmp = null;
	});

	it('returns all users when no oidcConfigName is provided to createFileUserStore', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'end-user@example.com', sub: 'sub-end', oidcConfigName: 'end-user' },
			{ username: 'staff@example.com', sub: 'sub-staff', oidcConfigName: 'staff-user' },
			{ username: 'shared@example.com', sub: 'sub-shared' },
		]);
		const store = createFileUserStore(tmp);
		const users = await store.listUsers();
		expect(users).toHaveLength(3);
	});

	it('filters to users with matching oidcConfigName or no oidcConfigName', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'end-user@example.com', sub: 'sub-end', oidcConfigName: 'end-user' },
			{ username: 'staff@example.com', sub: 'sub-staff', oidcConfigName: 'staff-user' },
			{ username: 'shared@example.com', sub: 'sub-shared' },
		]);
		const store = createFileUserStore(tmp, 'end-user');
		const users = await store.listUsers();
		expect(users).toHaveLength(2);
		expect(users.find((u) => u.username === 'end-user@example.com')).toBeDefined();
		expect(users.find((u) => u.username === 'shared@example.com')).toBeDefined();
		expect(users.find((u) => u.username === 'staff@example.com')).toBeUndefined();
	});

	it('excludes users from a different oidcConfigName', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'end@example.com', sub: 'sub-end', oidcConfigName: 'end-user' },
			{ username: 'staff@example.com', sub: 'sub-staff', oidcConfigName: 'staff-user' },
		]);
		const endStore = createFileUserStore(tmp, 'end-user');
		const staffStore = createFileUserStore(tmp, 'staff-user');

		const endUsers = await endStore.listUsers();
		expect(endUsers).toHaveLength(1);
		expect(endUsers[0]?.username).toBe('end@example.com');

		const staffUsers = await staffStore.listUsers();
		expect(staffUsers).toHaveLength(1);
		expect(staffUsers[0]?.username).toBe('staff@example.com');
	});

	it('findByUsername respects oidcConfigName filter', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'end@example.com', sub: 'sub-end', oidcConfigName: 'end-user' },
			{ username: 'staff@example.com', sub: 'sub-staff', oidcConfigName: 'staff-user' },
		]);
		const endStore = createFileUserStore(tmp, 'end-user');

		expect(await endStore.findByUsername('end@example.com')).toBeDefined();
		expect(await endStore.findByUsername('staff@example.com')).toBeUndefined();
	});

	it('findBySub respects oidcConfigName filter', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'end@example.com', sub: 'sub-end', oidcConfigName: 'end-user' },
			{ username: 'staff@example.com', sub: 'sub-staff', oidcConfigName: 'staff-user' },
		]);
		const staffStore = createFileUserStore(tmp, 'staff-user');

		expect(await staffStore.findBySub('sub-staff')).toBeDefined();
		expect(await staffStore.findBySub('sub-end')).toBeUndefined();
	});

	it('users without oidcConfigName are visible to all scoped stores', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'shared@example.com', sub: 'sub-shared' },
		]);
		const endStore = createFileUserStore(tmp, 'end-user');
		const staffStore = createFileUserStore(tmp, 'staff-user');

		expect(await endStore.findByUsername('shared@example.com')).toBeDefined();
		expect(await staffStore.findByUsername('shared@example.com')).toBeDefined();
	});

	it('applies oidcConfigName filtering across base and overlay files', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'base-alice', sub: 'sub-base-alice', oidcConfigName: 'config-a' },
			{ username: 'base-bob', sub: 'sub-base-bob', oidcConfigName: 'config-b' },
		]);
		writeUsers(tmp, 'mock-oidc.users.local.json', [
			{ username: 'overlay-charlie', sub: 'sub-overlay-charlie', oidcConfigName: 'config-a' },
			// No oidcConfigName: visible to all scoped stores per documented behavior
			{ username: 'overlay-dave', sub: 'sub-overlay-dave' },
		]);

		const store = createFileUserStore(tmp, 'config-a');
		const users = await store.listUsers();
		const usernames = users.map((u) => u.username).sort();

		// base-alice (config-a) and overlay-charlie (config-a) match; overlay-dave (no oidcConfigName) is shared
		expect(usernames).toEqual(['base-alice', 'overlay-charlie', 'overlay-dave'].sort());
		// base-bob belongs to config-b and must not appear
		expect(usernames).not.toContain('base-bob');
	});

	it('merges overlay and base users when no oidcConfigName filter is provided', async () => {
		if (!tmp) throw new Error('tmp not created');
		writeUsers(tmp, 'mock-oidc.users.json', [
			{ username: 'base-alice', sub: 'sub-base-alice', oidcConfigName: 'config-a' },
			{ username: 'base-bob', sub: 'sub-base-bob', oidcConfigName: 'config-b' },
		]);
		writeUsers(tmp, 'mock-oidc.users.local.json', [
			{ username: 'overlay-charlie', sub: 'sub-overlay-charlie', oidcConfigName: 'config-a' },
			{ username: 'overlay-dave', sub: 'sub-overlay-dave' },
		]);

		const store = createFileUserStore(tmp);
		const users = await store.listUsers();
		const usernames = users.map((u) => u.username).sort();

		expect(usernames).toEqual(['base-alice', 'base-bob', 'overlay-charlie', 'overlay-dave'].sort());
	});

	it('skips user entry with non-string oidcConfigName and warns', async () => {
		if (!tmp) throw new Error('tmp not created');
		const warnSpy: unknown[] = [];
		const origWarn = console.warn;
		console.warn = (...args: unknown[]) => warnSpy.push(args);
		try {
			writeUsers(tmp, 'mock-oidc.users.json', [
				{ username: 'bad@example.com', sub: 'sub-bad', oidcConfigName: 123 },
				{ username: 'good@example.com', sub: 'sub-good' },
			]);
			const store = createFileUserStore(tmp);
			const users = await store.listUsers();
			expect(users).toHaveLength(1);
			expect(users[0]?.username).toBe('good@example.com');
			expect(warnSpy.length).toBeGreaterThan(0);
			expect(
				warnSpy.some((args) =>
					(args as unknown[]).some(
						(arg) =>
							typeof arg === 'string' &&
							arg.includes('"oidcConfigName" must be a string'),
					),
				),
			).toBe(true);
		} finally {
			console.warn = origWarn;
		}
	});
});
