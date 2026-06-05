import path from 'node:path';
import { applyWorktreeSuffix, type DotEnvValues, hostnameFromUrl, readDotEnv } from '@cellix/local-dev';
import type { OcomHostnames, OcomLocalDevOptions } from './types.ts';
import { getWorkspaceRoot } from './workspace.ts';

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

export function getOcomHostnames(options: OcomLocalDevOptions = {}): OcomHostnames {
	const env = (options.env ?? process.env) as NodeJS.ProcessEnv & OcomEnvValues;
	const workspaceRoot = options.workspaceRoot ?? getWorkspaceRoot();
	const communityEnv = readAppEnv(workspaceRoot, 'ui-community');
	const staffEnv = readAppEnv(workspaceRoot, 'ui-staff');
	const worktreeName = env.WORKTREE_NAME;
	const communityHostname = requiredHostname(env.VITE_APP_UI_COMMUNITY_BASE_URL ?? communityEnv.VITE_APP_UI_COMMUNITY_BASE_URL ?? '', 'VITE_APP_UI_COMMUNITY_BASE_URL');
	const apiHostname = requiredHostname(env.VITE_COMMON_API_ENDPOINT ?? communityEnv.VITE_COMMON_API_ENDPOINT ?? '', 'VITE_COMMON_API_ENDPOINT');
	const mockAuthHostname = requiredHostname(env.VITE_APP_UI_COMMUNITY_B2C_AUTHORITY ?? communityEnv.VITE_APP_UI_COMMUNITY_B2C_AUTHORITY ?? '', 'VITE_APP_UI_COMMUNITY_B2C_AUTHORITY');
	const staffHostname = requiredHostname(
		env.VITE_APP_UI_STAFF_BASE_URL ?? staffEnv.VITE_APP_UI_STAFF_BASE_URL ?? env.VITE_APP_UI_STAFF_AAD_REDIRECT_URI ?? staffEnv.VITE_APP_UI_STAFF_AAD_REDIRECT_URI ?? '',
		'VITE_APP_UI_STAFF_BASE_URL',
	);

	return {
		uiCommunity: applyWorktreeSuffix(communityHostname, worktreeName),
		uiStaff: applyWorktreeSuffix(staffHostname, worktreeName),
		api: applyWorktreeSuffix(apiHostname, worktreeName),
		mockAuth: applyWorktreeSuffix(mockAuthHostname, worktreeName),
		docs: applyWorktreeSuffix(`docs.${communityHostname}`, worktreeName),
	};
}

export type { OcomHostnames, OcomLocalDevOptions } from './types.ts';
