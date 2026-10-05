import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { SignInResult } from '@ocom/video-encoder-client';

/** A saved sign-in, tied to the issuer and client it came from. */
export interface StoredSession {
	issuer: string;
	clientId: string;
	accessToken: string;
	expiresAt: string;
	refreshToken?: string;
	claims: Record<string, unknown>;
}

export interface SessionStore {
	load(): Promise<StoredSession | undefined>;
	save(session: StoredSession): Promise<void>;
	clear(): Promise<void>;
}

/**
 * Keeps the session in a JSON file readable only by the current user, since
 * it holds tokens.
 */
export function createFileSessionStore(filePath: string): SessionStore {
	return {
		async load() {
			try {
				return JSON.parse(await readFile(filePath, 'utf8')) as StoredSession;
			} catch {
				return undefined;
			}
		},
		async save(session) {
			await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
			await writeFile(filePath, JSON.stringify(session, null, 2), { mode: 0o600 });
		},
		async clear() {
			await rm(filePath, { force: true });
		},
	};
}

export function toStoredSession(issuer: string, clientId: string, result: SignInResult): StoredSession {
	return {
		issuer,
		clientId,
		accessToken: result.accessToken,
		expiresAt: result.expiresAt.toISOString(),
		...(result.refreshToken ? { refreshToken: result.refreshToken } : {}),
		claims: result.claims,
	};
}
