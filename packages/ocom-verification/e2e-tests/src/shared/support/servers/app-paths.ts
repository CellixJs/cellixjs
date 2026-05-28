import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '../../../../../../..');

export const appPaths = {
	apiDir: resolve(workspaceRoot, 'apps/api'),
	oauth2MockDir: resolve(workspaceRoot, 'apps/server-oauth2-mock'),
	uiCommunityDir: resolve(workspaceRoot, 'apps/ui-community'),
	uiStaffDir: resolve(workspaceRoot, 'apps/ui-staff'),
} as const;
