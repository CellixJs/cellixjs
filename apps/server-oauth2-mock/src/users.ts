import fs from 'node:fs';
import path from 'node:path';
import type { MockOAuth2User, MockOAuth2UserStore } from '@cellix/server-oauth2-mock-seedwork';

export function createFileUserStore(appDir: string): MockOAuth2UserStore {
	const committedPath = path.join(appDir, 'mock-oidc.users.json');
	const localPath = path.join(appDir, 'mock-oidc.users.local.json');

	function readJsonIfExists(p: string): unknown {
		try {
			if (!fs.existsSync(p)) return undefined;
			const raw = fs.readFileSync(p, 'utf-8');
			return JSON.parse(raw) as unknown;
		} catch (err) {
			console.warn(`[server-oauth2-mock] Could not read users file at ${p}:`, err);
			return undefined;
		}
	}

	function loadCommitted(): MockOAuth2User[] {
		const raw = readJsonIfExists(committedPath);
		if (!raw) return [];
		if (!Array.isArray(raw)) return [];
		return raw as MockOAuth2User[];
	}

	function loadOverlay(): MockOAuth2User[] {
		const raw = readJsonIfExists(localPath);
		if (!raw) return [];
		if (!Array.isArray(raw)) return [];
		return raw as MockOAuth2User[];
	}

	function mergeUsers(): MockOAuth2User[] {
		const committed = loadCommitted();
		const overlay = loadOverlay();
		const seenUsernames = new Set<string>();
		const seenSubs = new Set<string>();
		const out: MockOAuth2User[] = [];
		for (const u of committed) {
			if (seenUsernames.has(u.username)) throw new Error(`[server-oauth2-mock] Duplicate username in committed users: ${u.username}`);
			if (seenSubs.has(u.sub)) throw new Error(`[server-oauth2-mock] Duplicate sub in committed users: ${u.sub}`);
			seenUsernames.add(u.username);
			seenSubs.add(u.sub);
			out.push(u);
		}
		for (const u of overlay) {
			if (seenUsernames.has(u.username)) throw new Error(`[server-oauth2-mock] Duplicate username in overlay users: ${u.username}`);
			if (seenSubs.has(u.sub)) throw new Error(`[server-oauth2-mock] Duplicate sub in overlay users: ${u.sub}`);
			seenUsernames.add(u.username);
			seenSubs.add(u.sub);
			out.push(u);
		}
		return out;
	}

	async function persistOverlay(users: MockOAuth2User[]): Promise<void> {
		try {
			const dir = path.dirname(localPath);
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			const tmpPath = `${localPath}.tmp`;
			fs.writeFileSync(tmpPath, JSON.stringify(users, null, 2), { encoding: 'utf-8' });
			fs.renameSync(tmpPath, localPath);
		} catch (err) {
			throw err;
		}
	}

	return {
		async listUsers() {
			return mergeUsers();
		},
		async findByUsername(username: string) {
			const list = mergeUsers();
			return list.find((u) => u.username === username);
		},
		async findBySub(sub: string) {
			const list = mergeUsers();
			return list.find((u) => u.sub === sub);
		},
		async addUser(user: MockOAuth2User) {
			const committed = loadCommitted();
			const overlay = loadOverlay();
			// ensure uniqueness
			const all = [...committed, ...overlay];
			if (all.find((u) => u.username === user.username)) throw new Error(`[server-oauth2-mock] Username already exists: ${user.username}`);
			if (all.find((u) => u.sub === user.sub)) throw new Error(`[server-oauth2-mock] Sub already exists: ${user.sub}`);
			overlay.push(user);
			await persistOverlay(overlay);
		},
		async persist() {
			// noop - overlay persisted on each add
		},
	};
}
