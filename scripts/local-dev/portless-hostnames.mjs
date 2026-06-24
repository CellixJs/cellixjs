import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {Record<string, string>} DotEnvValues
 * @typedef {object} PortlessHostnames
 * @property {string} uiCommunity
 * @property {string} uiStaff
 * @property {string} api
 * @property {string} mockAuth
 * @property {string} docs
 */

const PORTLESS_PORT = 1355;
const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = resolve(scriptDir, '../..');

/**
 * @param {string} filePath
 * @returns {DotEnvValues}
 */
function readDotEnv(filePath) {
	if (!existsSync(filePath)) return {};
	/** @type {DotEnvValues} */
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

/**
 * @param {string} url
 * @returns {string | null}
 */
function hostnameFrom(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

/**
 * @param {string} key
 * @param {DotEnvValues} values
 * @returns {string | null}
 */
function hostnameFor(key, values) {
	return hostnameFrom(process.env[key] ?? values[key] ?? '');
}

function applyWorktreeSuffix(hostname, worktreeName) {
	if (!worktreeName) return hostname;
	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

export function getHostnames() {
	const uiEnv = readDotEnv(resolve(workspaceRoot, 'apps/ui-community/.env'));
	const staffEnv = readDotEnv(resolve(workspaceRoot, 'apps/ui-staff/.env'));
	const wt = process.env.WORKTREE_NAME ?? '';

	const uiCommunity = hostnameFor('VITE_APP_UI_COMMUNITY_BASE_URL', uiEnv);
	const api = hostnameFor('VITE_COMMON_API_ENDPOINT', uiEnv);
	const mockAuth = hostnameFor('VITE_APP_UI_COMMUNITY_B2C_AUTHORITY', uiEnv);
	const uiStaff = hostnameFor('VITE_APP_UI_STAFF_STAFF_USER_AAD_REDIRECT_URI', staffEnv) ?? hostnameFor('VITE_APP_UI_STAFF_AAD_REDIRECT_URI', staffEnv);

	if (!uiCommunity || !api || !mockAuth || !uiStaff) {
		throw new Error('portless-hostnames: could not derive all hostnames from .env files. ' + 'Ensure apps/ui-community/.env and apps/ui-staff/.env are present.');
	}
	const docs = `docs.${uiCommunity}`;

	return {
		uiCommunity: applyWorktreeSuffix(uiCommunity, wt),
		uiStaff: applyWorktreeSuffix(uiStaff, wt),
		api: applyWorktreeSuffix(api, wt),
		mockAuth: applyWorktreeSuffix(mockAuth, wt),
		docs: applyWorktreeSuffix(docs, wt),
	};
}

/**
 * Builds a full portless-proxied URL for the given hostname and optional path.
 * @param {string} hostname
 * @param {string} [path]
 * @returns {string}
 */
export function buildPortlessUrl(hostname, path = '') {
	return `https://${hostname}:${PORTLESS_PORT}${path}`;
}

export { PORTLESS_PORT };
