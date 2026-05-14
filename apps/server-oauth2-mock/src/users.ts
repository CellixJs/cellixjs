import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { debugLog, type MockOAuth2User, type MockOAuth2UserStore } from '@cellix/server-oauth2-mock-seedwork';

export function createFileUserStore(appDir: string): MockOAuth2UserStore {
	const committedPath = path.join(appDir, 'mock-oidc.users.json');
	const localPath = path.join(appDir, 'mock-oidc.users.local.json');

	const fileCache = new Map<string, { mtime: number; data: MockOAuth2User[] }>();

	// Simple async mutex to serialize overlay writes and avoid lost updates from concurrent signups.
	let writeMutex: Promise<void> = Promise.resolve();
	function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
		const run = async () => {
			return await fn();
		};
		// Ensure the chain continues even if a previous operation rejected.
		const next = writeMutex.then(run, run);
		writeMutex = next.then(
			() => undefined,
			() => undefined,
		);
		return next;
	}

	function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
		return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
	}

	async function getValidatedForPath(p: string): Promise<MockOAuth2User[]> {
		let mtime: number;
		try {
			mtime = (await stat(p)).mtimeMs;
		} catch (error) {
			if (isEnoentError(error)) {
				fileCache.delete(p);
				return [];
			}
			console.warn(`[server-oauth2-mock] Could not read users file at ${p}:`, error);
			return [];
		}

		const cached = fileCache.get(p);
		if (cached?.mtime === mtime) {
			return cached.data;
		}

		let raw: string;
		try {
			raw = await readFile(p, 'utf-8');
		} catch (error) {
			if (isEnoentError(error)) {
				fileCache.delete(p);
				return [];
			}
			console.warn(`[server-oauth2-mock] Could not read users file at ${p}:`, error);
			return [];
		}

		if (raw.trim().length === 0) {
			const data: MockOAuth2User[] = [];
			fileCache.set(p, { mtime, data });
			return data;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw) as unknown;
		} catch (error) {
			console.warn(`[server-oauth2-mock] Could not parse users file at ${p}:`, error);
			const data: MockOAuth2User[] = [];
			fileCache.set(p, { mtime, data });
			return data;
		}

		const validated = validateEntries(parsed, p);
		fileCache.set(p, { mtime, data: validated });
		return validated;
	}

	function validateEntries(raw: unknown, filePath: string): MockOAuth2User[] {
		if (raw === undefined) {
			return [];
		}
		if (!Array.isArray(raw)) {
			console.warn(`[server-oauth2-mock] Users file at ${filePath} does not contain a JSON array; treating as no users.`);
			return [];
		}

		const out: MockOAuth2User[] = [];

		for (let i = 0; i < raw.length; i++) {
			const entry = raw[i] as unknown;

			if (typeof entry !== 'object' || entry === null) {
				console.warn(`[server-oauth2-mock] Invalid user entry in ${filePath} at index ${i}: expected object, got ${typeof entry}, skipping`);
				continue;
			}

			const e = entry as {
				username?: unknown;
				sub?: unknown;
				claims?: unknown;
				password?: unknown;
			};

			const username = e.username;
			if (typeof username !== 'string') {
				console.warn(`[server-oauth2-mock] Invalid user entry in ${filePath} at index ${i}: "username" must be a string, skipping`);
				continue;
			}

			let claims: { sub?: unknown; [k: string]: unknown } | undefined;
			if (e.claims !== undefined) {
				if (typeof e.claims !== 'object' || e.claims === null || Array.isArray(e.claims)) {
					console.warn(`[server-oauth2-mock] Invalid user entry in ${filePath} for "${username}": "claims" must be an object if present, skipping`);
					continue;
				}
				claims = e.claims as { sub?: unknown; [k: string]: unknown };
			}

			const subFromField = typeof e.sub === 'string' ? e.sub : undefined;
			const subFromClaims = claims && typeof claims.sub === 'string' ? (claims.sub as string) : undefined;

			if (subFromField !== undefined && subFromClaims !== undefined && subFromField !== subFromClaims) {
				console.warn(`[server-oauth2-mock] Invalid user entry in ${filePath} for "${username}": conflicting "sub" values between top-level "sub" and "claims.sub", skipping`);
				continue;
			}

			const sub = subFromField ?? subFromClaims;

			if (!sub) {
				console.warn(`[server-oauth2-mock] Invalid user entry in ${filePath} for "${username}": missing "sub" (either top-level or claims.sub), skipping`);
				continue;
			}

			let password: string | undefined;
			if (e.password !== undefined) {
				if (typeof e.password !== 'string') {
					console.warn(`[server-oauth2-mock] Invalid user entry in ${filePath} for "${username}": "password" must be a string if present, skipping`);
					continue;
				}
				password = e.password;
			}

			const user: MockOAuth2User = {
				username,
				sub,
				...(claims ? { claims } : {}),
				...(password ? { password } : {}),
			};

			out.push(user);
		}

		return out;
	}

	function loadCommitted(): Promise<MockOAuth2User[]> {
		return getValidatedForPath(committedPath);
	}

	function loadOverlay(): Promise<MockOAuth2User[]> {
		return getValidatedForPath(localPath);
	}

	async function mergeUsers(): Promise<MockOAuth2User[]> {
		const [committed, overlay] = await Promise.all([loadCommitted(), loadOverlay()]);
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

	// persistOverlayUnsafe performs the actual write to disk and updates the cache.
	// It MUST NOT acquire the write mutex. Callers are responsible for holding the
	// write lock when calling this function. Use persist() below for a locked write.
	async function persistOverlayUnsafe(users: MockOAuth2User[]): Promise<void> {
		const dir = path.dirname(localPath);
		await mkdir(dir, { recursive: true });
		// Use a unique tmp filename per write to avoid collisions/races with other writers.
		const tmpPath = `${localPath}.${randomUUID()}.tmp`;
		const data = JSON.stringify(users, null, 2);
		// Write with restrictive permissions where supported (mode 0o600) to avoid
		// world-readable plaintext password files.
		await writeFile(tmpPath, data, { encoding: 'utf-8', mode: 0o600 });
		// Atomic replace: on POSIX, rename() replaces atomically without a window.
		// On Windows, rename() fails if destination exists, so fall back to unlink-first approach.
		try {
			await rename(tmpPath, localPath);
		} catch (error) {
			// If rename fails and looks like a Windows EEXIST, fall back to unlink-first
			const isWindowsExist = error instanceof Error && 'code' in error && (error.code === 'EEXIST' || error.code === 'EPERM');
			if (isWindowsExist) {
				try {
					await unlink(localPath);
				} catch (unlinkErr) {
					if (!isEnoentError(unlinkErr)) throw unlinkErr;
				}
				await rename(tmpPath, localPath);
			} else {
				throw error;
			}
		}
		try {
			const fileStat = await stat(localPath);
			fileCache.set(localPath, { mtime: fileStat.mtimeMs, data: users });
		} catch (_error) {
			fileCache.delete(localPath);
		}
	}

	const portalName = path.basename(appDir);
	void Promise.all([loadCommitted(), loadOverlay()])
		.then(([initialCommitted, initialOverlay]) => {
			console.info(`[server-oauth2-mock] Loaded ${initialCommitted.length} committed + ${initialOverlay.length} local users for portal "${portalName}" (${initialCommitted.length + initialOverlay.length} total)`);
		})
		.catch((error) => {
			console.warn(`[server-oauth2-mock] Failed to preload users for portal "${portalName}":`, error);
		});

	return {
		async listUsers() {
			return await mergeUsers();
		},
		async findByUsername(username: string) {
			const list = await mergeUsers();
			return list.find((u) => u.username === username);
		},
		async findBySub(sub: string) {
			const list = await mergeUsers();
			return list.find((u) => u.sub === sub);
		},
		addUser(user: MockOAuth2User) {
			// Perform read-modify-write under the write lock to avoid lost updates when
			// multiple concurrent signups occur. This ensures the overlay is validated
			// against the latest state and updated atomically.
			return withWriteLock(async () => {
				const [committed, overlay] = await Promise.all([loadCommitted(), loadOverlay()]);
				const all = [...committed, ...overlay];
				if (all.find((u) => u.username === user.username)) throw new Error(`[server-oauth2-mock] Username already exists: ${user.username}`);
				if (all.find((u) => u.sub === user.sub)) throw new Error(`[server-oauth2-mock] Sub already exists: ${user.sub}`);
				overlay.push(user);
				// We already hold the write lock here, so call the unsafe variant which does
				// the actual disk write without attempting to re-acquire the mutex.
				await persistOverlayUnsafe(overlay);
				console.info(`[server-oauth2-mock] New user registered via signup for portal "${portalName}": ${user.username}`);
				debugLog('[server-oauth2-mock] addUser persisted', { portal: portalName, user: user.username });
			});
		},
		persist() {
			// Perform load + write under the same write lock to avoid races where
			// a concurrent addUser updates the overlay between load and persist.
			return withWriteLock(async () => {
				const overlay = await loadOverlay();
				await persistOverlayUnsafe(overlay);
			});
		},
	};
}
