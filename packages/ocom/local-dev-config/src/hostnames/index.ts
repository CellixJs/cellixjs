import path from 'node:path';
import { type DotEnvValues, readDotEnv } from '@cellix/local-dev/files';
import { applyWorktreeSuffix, hostnameFromUrl } from '@cellix/local-dev/urls';
import { resolveWorkspaceRoot } from '@cellix/local-dev/workspace';
import type { OcomHostnames, OcomLocalDevOptions } from '../types.ts';

interface OcomEnvValues {
	WORKTREE_NAME?: string;
	VITE_APP_UI_COMMUNITY_BASE_URL?: string;
	VITE_COMMON_API_ENDPOINT?: string;
	VITE_APP_UI_COMMUNITY_B2C_AUTHORITY?: string;
	VITE_APP_UI_STAFF_BASE_URL?: string;
	VITE_APP_UI_STAFF_AAD_REDIRECT_URI?: string;
}

function requiredHostname(url: string, key: string): string {
	const hostname = hostnameFromUrl(url);
	if (!hostname) {
		throw new Error(`[ocom-local-dev] Missing or invalid URL for ${key}`);
	}

	return hostname;
}

function readAppEnv(workspaceRoot: string, appName: string): DotEnvValues & OcomEnvValues {
	return readDotEnv(path.join(workspaceRoot, 'apps', appName, '.env')) as DotEnvValues & OcomEnvValues;
}

function firstDefinedUrl(...values: Array<string | undefined>): string {
	return values.find((value) => value !== undefined) ?? '';
}

function requiredHostnameFromSources(key: string, ...values: Array<string | undefined>): string {
	return requiredHostname(firstDefinedUrl(...values), key);
}

/**
 * Resolves the OCOM local-development hostnames from app `.env` files and
 * optional process environment overrides.
 *
 * The package keeps OCOM-specific policy here: which app env files to read,
 * which env keys define the public local hostnames, and how the documentation
 * hostname is derived. Generic URL parsing and worktree suffixing remain in
 * `@cellix/local-dev`.
 *
 * @param options - Optional environment and workspace-root overrides.
 * @returns Worktree-aware OCOM hostnames.
 * @throws When a required URL cannot be found or parsed.
 *
 * @example
 * ```ts
 * const hostnames = getOcomHostnames({
 *   env: { WORKTREE_NAME: 'jason/feature' },
 *   workspaceRoot,
 * });
 * ```
 */
export function getOcomHostnames(options: OcomLocalDevOptions = {}): OcomHostnames {
	const env = (options.env ?? process.env) as NodeJS.ProcessEnv & OcomEnvValues;
	const workspaceRoot = options.workspaceRoot ?? resolveWorkspaceRoot();
	const communityEnv = readAppEnv(workspaceRoot, 'ui-community');
	const staffEnv = readAppEnv(workspaceRoot, 'ui-staff');
	const worktreeName = env.WORKTREE_NAME;
	const communityHostname = requiredHostnameFromSources('VITE_APP_UI_COMMUNITY_BASE_URL', env.VITE_APP_UI_COMMUNITY_BASE_URL, communityEnv.VITE_APP_UI_COMMUNITY_BASE_URL);
	const apiHostname = requiredHostnameFromSources('VITE_COMMON_API_ENDPOINT', env.VITE_COMMON_API_ENDPOINT, communityEnv.VITE_COMMON_API_ENDPOINT);
	const mockAuthHostname = requiredHostnameFromSources('VITE_APP_UI_COMMUNITY_B2C_AUTHORITY', env.VITE_APP_UI_COMMUNITY_B2C_AUTHORITY, communityEnv.VITE_APP_UI_COMMUNITY_B2C_AUTHORITY);
	const staffHostname = requiredHostnameFromSources(
		'VITE_APP_UI_STAFF_BASE_URL',
		env.VITE_APP_UI_STAFF_BASE_URL,
		staffEnv.VITE_APP_UI_STAFF_BASE_URL,
		env.VITE_APP_UI_STAFF_AAD_REDIRECT_URI,
		staffEnv.VITE_APP_UI_STAFF_AAD_REDIRECT_URI,
	);

	return {
		uiCommunity: applyWorktreeSuffix(communityHostname, worktreeName),
		uiStaff: applyWorktreeSuffix(staffHostname, worktreeName),
		api: applyWorktreeSuffix(apiHostname, worktreeName),
		mockAuth: applyWorktreeSuffix(mockAuthHostname, worktreeName),
		docs: applyWorktreeSuffix(`docs.${communityHostname}`, worktreeName),
	};
}

export type { OcomHostnames, OcomLocalDevOptions } from '../types.ts';
