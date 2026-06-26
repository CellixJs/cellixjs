import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFileUserStore } from '../src/index.ts';

function makeTempDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'server-oauth2-mock-users-'));
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
