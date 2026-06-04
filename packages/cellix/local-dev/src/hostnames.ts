import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { type ResolveWorkspaceRootOptions, resolveWorkspaceRoot } from './workspace.ts';

export interface PortlessHostnames {
	uiCommunity: string;
	uiStaff: string;
	api: string;
	mockAuth: string;
	docs: string;
}

export type PortlessHostnameKey = keyof PortlessHostnames;

interface ResolvePortlessHostnamesOptions extends ResolveWorkspaceRootOptions {
	env?: NodeJS.ProcessEnv;
}

type DotEnvValues = Record<string, string>;

export const PORTLESS_PORT = 1355;

function readDotEnv(filePath: string): DotEnvValues {
	if (!existsSync(filePath)) return {};

	const result: DotEnvValues = {};
	for (const line of readFileSync(filePath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const eqIdx = trimmed.indexOf('=');
		if (eqIdx === -1) continue;
		result[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
	}

	return result;
}

function hostnameFrom(url: string): string | null {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

function hostnameFor(key: string, values: DotEnvValues, env: NodeJS.ProcessEnv): string | null {
	return hostnameFrom(env[key] ?? values[key] ?? '');
}

function applyWorktreeSuffix(hostname: string, worktreeName: string | undefined): string {
	if (!worktreeName) return hostname;
	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

/**
 * Resolves the local hostnames shared by the main Cellix dev applications.
 */
export function resolvePortlessHostnames(options: ResolvePortlessHostnamesOptions = {}): PortlessHostnames {
	const env = options.env ?? process.env;
	const workspaceRoot = resolveWorkspaceRoot(options);
	const uiEnv = readDotEnv(path.join(workspaceRoot, 'apps', 'ui-community', '.env'));
	const staffEnv = readDotEnv(path.join(workspaceRoot, 'apps', 'ui-staff', '.env'));

	const uiCommunity = hostnameFor('VITE_APP_UI_COMMUNITY_BASE_URL', uiEnv, env);
	const api = hostnameFor('VITE_COMMON_API_ENDPOINT', uiEnv, env);
	const mockAuth = hostnameFor('VITE_APP_UI_COMMUNITY_B2C_AUTHORITY', uiEnv, env);
	const uiStaff = hostnameFor('VITE_APP_UI_STAFF_AAD_REDIRECT_URI', staffEnv, env);

	if (!uiCommunity || !api || !mockAuth || !uiStaff) {
		throw new Error('[local-dev] Could not derive all portless hostnames. Ensure apps/ui-community/.env and apps/ui-staff/.env are present.');
	}

	const worktreeName = env['WORKTREE_NAME'];
	const docs = `docs.${uiCommunity}`;

	return {
		uiCommunity: applyWorktreeSuffix(uiCommunity, worktreeName),
		uiStaff: applyWorktreeSuffix(uiStaff, worktreeName),
		api: applyWorktreeSuffix(api, worktreeName),
		mockAuth: applyWorktreeSuffix(mockAuth, worktreeName),
		docs: applyWorktreeSuffix(docs, worktreeName),
	};
}

/**
 * Builds a portless-proxied HTTPS URL for a hostname and optional path.
 */
export function buildPortlessUrl(hostname: string, relativePath = ''): string {
	return `https://${hostname}:${PORTLESS_PORT}${relativePath}`;
}
