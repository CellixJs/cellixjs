import { fileURLToPath } from 'node:url';

const workspaceRootUrl = new URL('../../../../../../../', import.meta.url);

export const appPaths = {
	apiDir: fileURLToPath(new URL('apps/api/', workspaceRootUrl)),
	oauth2MockDir: fileURLToPath(new URL('apps/server-oauth2-mock/', workspaceRootUrl)),
	uiCommunityDir: fileURLToPath(new URL('apps/ui-community/', workspaceRootUrl)),
} as const;
