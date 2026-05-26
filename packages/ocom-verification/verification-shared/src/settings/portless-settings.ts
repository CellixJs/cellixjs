import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PortlessHostnames {
	uiCommunity: string;
	uiStaff: string;
	api: string;
	mockAuth: string;
	docs: string;
}

type DotEnvValues = Record<string, string>;

const PORTLESS_PORT = 1355;
const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '../../../../..');
const uiCommunityEnvPath = resolve(workspaceRoot, 'apps/ui-community/.env');
const uiStaffEnvPath = resolve(workspaceRoot, 'apps/ui-staff/.env');

function buildPortlessUrl(hostname: string, path = ''): string {
	return `https://${hostname}:${PORTLESS_PORT}${path}`;
}

function getHostnames(): PortlessHostnames {
	const uiCommunityEnv = readDotEnv(uiCommunityEnvPath);
	const uiStaffEnv = readDotEnv(uiStaffEnvPath);

	const hostnames = {
		uiCommunity: requireHostname(uiCommunityEnv, 'VITE_APP_UI_COMMUNITY_BASE_URL', uiCommunityEnvPath),
		uiStaff: requireHostname(uiStaffEnv, 'VITE_APP_UI_STAFF_AAD_REDIRECT_URI', uiStaffEnvPath),
		api: requireHostname(uiCommunityEnv, 'VITE_COMMON_API_ENDPOINT', uiCommunityEnvPath),
		mockAuth: requireHostname(uiCommunityEnv, 'VITE_APP_UI_COMMUNITY_B2C_AUTHORITY', uiCommunityEnvPath),
	};

	return applyWorktreeSuffixes(hostnames, process.env['WORKTREE_NAME'] ?? '');
}

function readDotEnv(filePath: string): DotEnvValues {
	if (!existsSync(filePath)) return {};
	const result: DotEnvValues = {};
	for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
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

function requireHostname(values: DotEnvValues, key: string, filePath: string): string {
	const hostname = hostnameFrom(values[key] ?? '');
	if (!hostname) {
		throw new Error(`portless-settings: could not derive hostname from ${key} in ${filePath}`);
	}
	return hostname;
}

function applyWorktreeSuffixes(hostnames: Omit<PortlessHostnames, 'docs'>, worktreeName: string): PortlessHostnames {
	return {
		uiCommunity: applyWorktreeSuffix(hostnames.uiCommunity, worktreeName),
		uiStaff: applyWorktreeSuffix(hostnames.uiStaff, worktreeName),
		api: applyWorktreeSuffix(hostnames.api, worktreeName),
		mockAuth: applyWorktreeSuffix(hostnames.mockAuth, worktreeName),
		docs: applyWorktreeSuffix(`docs.${hostnames.uiCommunity}`, worktreeName),
	};
}

function applyWorktreeSuffix(hostname: string, worktreeName: string): string {
	if (!worktreeName) return hostname;
	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

export { buildPortlessUrl, getHostnames, PORTLESS_PORT };
