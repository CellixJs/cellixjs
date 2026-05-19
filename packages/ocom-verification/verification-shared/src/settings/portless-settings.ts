/**
 * Portless hostname derivation for test environments.
 *
 * Mirrors the logic of `build-pipeline/scripts/portless-hostnames.mjs` —
 * hostnames are derived from the tracked .env files rather than hardcoded,
 * and the `WORKTREE_NAME` suffix is applied automatically.
 *
 * This keeps test-environment code in sync with the dev:portless startup
 * scripts without adding a cross-layer import to build-pipeline/.
 */

import { findWorkspaceRoot, readDotEnv, resolveWorkspacePath } from './settings-utils.ts';

const PORTLESS_PORT = 1355;
const workspaceRoot = findWorkspaceRoot();

const uiCommunityEnv = readDotEnv(resolveWorkspacePath(workspaceRoot, 'apps/ui-community/.env'));
const uiStaffEnv = readDotEnv(resolveWorkspacePath(workspaceRoot, 'apps/ui-staff/.env'));

function hostnameFromUrl(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

/** Splice `.<worktreeName>` in before `.localhost` for worktree isolation. */
function applyWorktreeSuffix(hostname: string): string {
	const wt = process.env['WORKTREE_NAME'];
	if (!wt) return hostname;
	return hostname.replace('.localhost', `.${wt}.localhost`);
}

/**
 * Returns all portless service hostnames scoped to the current worktree.
 * Hostnames are derived from the tracked .env files — no names are hardcoded.
 */
export function getHostnames() {
	const uiCommunity = hostnameFromUrl(uiCommunityEnv['VITE_APP_UI_COMMUNITY_BASE_URL'] ?? '');
	const api = hostnameFromUrl(uiCommunityEnv['VITE_COMMON_API_ENDPOINT'] ?? '');
	const mockAuth = hostnameFromUrl(uiCommunityEnv['VITE_APP_UI_COMMUNITY_B2C_AUTHORITY'] ?? '');
	const uiStaff = hostnameFromUrl(uiStaffEnv['VITE_APP_UI_STAFF_AAD_REDIRECT_URI'] ?? '');

	if (!uiCommunity || !api || !mockAuth) {
		throw new Error(
			'portless-settings: could not derive hostnames from .env files. ' + 'Ensure apps/ui-community/.env is present with VITE_APP_UI_COMMUNITY_BASE_URL, ' + 'VITE_COMMON_API_ENDPOINT, and VITE_APP_UI_COMMUNITY_B2C_AUTHORITY.',
		);
	}

	return {
		uiCommunity: applyWorktreeSuffix(uiCommunity),
		uiStaff: uiStaff ? applyWorktreeSuffix(uiStaff) : '',
		api: applyWorktreeSuffix(api),
		mockAuth: applyWorktreeSuffix(mockAuth),
		docs: applyWorktreeSuffix(`docs.${uiCommunity}`),
	};
}

/** Build a full portless HTTPS URL from a hostname and optional path. */
export function buildPortlessUrl(hostname: string, path = ''): string {
	return `https://${hostname}:${PORTLESS_PORT}${path}`;
}

export { PORTLESS_PORT };
