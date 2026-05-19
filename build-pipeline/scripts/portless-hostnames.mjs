/**
 * Shared portless hostname computation for git worktree isolation.
 *
 * Hostnames are derived from the tracked .env files, so this module contains
 * no hardcoded service names. When `WORKTREE_NAME` is set the worktree suffix
 * is spliced in before `.localhost`, giving each worktree its own subdomain
 * on the shared proxy port.
 *
 * Default (no worktree):
 *   ownercommunity.localhost        (read from VITE_APP_UI_COMMUNITY_BASE_URL)
 *   data-access.ownercommunity.localhost  (read from VITE_COMMON_API_ENDPOINT)
 *
 * With WORKTREE_NAME=feature-a:
 *   ownercommunity.feature-a.localhost
 *   data-access.ownercommunity.feature-a.localhost
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTLESS_PORT = 1355;
const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = resolve(scriptDir, '../..');

function readDotEnv(filePath) {
	if (!existsSync(filePath)) return {};
	const result = {};
	for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIdx = trimmed.indexOf('=');
		if (eqIdx === -1) continue;
		result[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
	}
	return result;
}

function hostnameFrom(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

/** Splice `.<worktreeName>` in before `.localhost` in an existing hostname. */
function applyWorktreeSuffix(hostname, worktreeName) {
	if (!worktreeName) return hostname;
	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

/**
 * Returns all service hostnames scoped to the current worktree (if any).
 * Hostname shapes are read from the tracked .env files — no names are
 * hardcoded in this module.
 */
export function getHostnames() {
	const uiEnv = readDotEnv(resolve(workspaceRoot, 'apps/ui-community/.env'));
	const staffEnv = readDotEnv(resolve(workspaceRoot, 'apps/ui-staff/.env'));
	const wt = process.env.WORKTREE_NAME ?? '';

	const uiCommunity = hostnameFrom(uiEnv['VITE_APP_UI_COMMUNITY_BASE_URL'] ?? '');
	const api = hostnameFrom(uiEnv['VITE_COMMON_API_ENDPOINT'] ?? '');
	const mockAuth = hostnameFrom(uiEnv['VITE_APP_UI_COMMUNITY_B2C_AUTHORITY'] ?? '');
	const uiStaff = hostnameFrom(staffEnv['VITE_APP_UI_STAFF_AAD_REDIRECT_URI'] ?? '');

	if (!uiCommunity || !api || !mockAuth || !uiStaff) {
		throw new Error('portless-hostnames: could not derive all hostnames from .env files. ' + 'Ensure apps/ui-community/.env and apps/ui-staff/.env are present.');
	}

	return {
		uiCommunity: applyWorktreeSuffix(uiCommunity, wt),
		uiStaff: applyWorktreeSuffix(uiStaff, wt),
		api: applyWorktreeSuffix(api, wt),
		mockAuth: applyWorktreeSuffix(mockAuth, wt),
		docs: applyWorktreeSuffix(`docs.${uiCommunity}`, wt),
	};
}

/**
 * Builds a full portless-proxied URL for the given hostname and optional path.
 */
export function buildPortlessUrl(hostname, path = '') {
	return `https://${hostname}:${PORTLESS_PORT}${path}`;
}

export { PORTLESS_PORT };
