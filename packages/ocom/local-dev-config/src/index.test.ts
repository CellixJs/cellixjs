import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildOcomUrls, getOcomHostnames } from '@ocom/local-dev-config';
import { describe, expect, it } from 'vitest';

function createWorkspaceFixture(): string {
	const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'ocom-local-dev-config-'));
	writeFileSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'), 'packages:\n  - "apps/*"\n');
	mkdirSync(path.join(workspaceRoot, 'apps', 'ui-community'), { recursive: true });
	mkdirSync(path.join(workspaceRoot, 'apps', 'ui-staff'), { recursive: true });
	writeFileSync(
		path.join(workspaceRoot, 'apps', 'ui-community', '.env'),
		[
			'VITE_APP_UI_COMMUNITY_BASE_URL=https://ownercommunity.localhost:1355',
			'VITE_COMMON_API_ENDPOINT=https://data-access.ownercommunity.localhost:1355/api/graphql',
			'VITE_APP_UI_COMMUNITY_B2C_AUTHORITY=https://mock-auth.ownercommunity.localhost:1355/community',
		].join('\n'),
	);
	writeFileSync(path.join(workspaceRoot, 'apps', 'ui-staff', '.env'), 'VITE_APP_UI_STAFF_BASE_URL=https://staff.ownercommunity.localhost:1355\n');

	return workspaceRoot;
}

describe('@ocom/local-dev-config', () => {
	it('resolves OCOM hostnames from app env files and applies a safe worktree suffix', () => {
		const workspaceRoot = createWorkspaceFixture();

		expect(
			getOcomHostnames({
				env: { WORKTREE_NAME: 'Jason/Feature 123' },
				workspaceRoot,
			}),
		).toEqual({
			uiCommunity: 'ownercommunity.jason-feature-123.localhost',
			uiStaff: 'staff.ownercommunity.jason-feature-123.localhost',
			api: 'data-access.ownercommunity.jason-feature-123.localhost',
			mockAuth: 'mock-auth.ownercommunity.jason-feature-123.localhost',
			docs: 'docs.ownercommunity.jason-feature-123.localhost',
		});
	});

	it('builds the complete OCOM local URL set for app wrapper scripts', () => {
		const workspaceRoot = createWorkspaceFixture();

		expect(buildOcomUrls({ env: {}, workspaceRoot })).toEqual({
			uiCommunityBaseUrl: 'https://ownercommunity.localhost:1355',
			uiCommunityRedirectUrl: 'https://ownercommunity.localhost:1355/auth-redirect',
			uiStaffBaseUrl: 'https://staff.ownercommunity.localhost:1355',
			uiStaffRedirectUrl: 'https://staff.ownercommunity.localhost:1355/auth-redirect',
			apiGraphqlUrl: 'https://data-access.ownercommunity.localhost:1355/api/graphql',
			mockCommunityAuthorityUrl: 'https://mock-auth.ownercommunity.localhost:1355/community',
			mockCommunityJwksUrl: 'https://mock-auth.ownercommunity.localhost:1355/community/.well-known/jwks.json',
			mockStaffAuthorityUrl: 'https://mock-auth.ownercommunity.localhost:1355/staff',
			mockStaffJwksUrl: 'https://mock-auth.ownercommunity.localhost:1355/staff/.well-known/jwks.json',
			docsBaseUrl: 'https://docs.ownercommunity.localhost:1355',
		});
	});

	it('lets environment values override app env files', () => {
		const workspaceRoot = createWorkspaceFixture();

		expect(
			getOcomHostnames({
				env: {
					VITE_APP_UI_COMMUNITY_BASE_URL: 'https://community.override.localhost:1355',
					VITE_COMMON_API_ENDPOINT: 'https://api.override.localhost:1355/api/graphql',
					VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: 'https://auth.override.localhost:1355/community',
					VITE_APP_UI_STAFF_BASE_URL: 'https://staff.override.localhost:1355',
				},
				workspaceRoot,
			}),
		).toEqual({
			uiCommunity: 'community.override.localhost',
			uiStaff: 'staff.override.localhost',
			api: 'api.override.localhost',
			mockAuth: 'auth.override.localhost',
			docs: 'docs.community.override.localhost',
		});
	});

	it('does not duplicate a worktree suffix when hostnames are already scoped', () => {
		const workspaceRoot = createWorkspaceFixture();

		expect(
			getOcomHostnames({
				env: {
					WORKTREE_NAME: 'Jason/Feature 123',
					VITE_APP_UI_COMMUNITY_BASE_URL: 'https://ownercommunity.jason-feature-123.localhost:1355',
					VITE_COMMON_API_ENDPOINT: 'https://data-access.ownercommunity.jason-feature-123.localhost:1355/api/graphql',
					VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: 'https://mock-auth.ownercommunity.jason-feature-123.localhost:1355/community',
					VITE_APP_UI_STAFF_BASE_URL: 'https://staff.ownercommunity.jason-feature-123.localhost:1355',
				},
				workspaceRoot,
			}),
		).toEqual({
			uiCommunity: 'ownercommunity.jason-feature-123.localhost',
			uiStaff: 'staff.ownercommunity.jason-feature-123.localhost',
			api: 'data-access.ownercommunity.jason-feature-123.localhost',
			mockAuth: 'mock-auth.ownercommunity.jason-feature-123.localhost',
			docs: 'docs.ownercommunity.jason-feature-123.localhost',
		});
	});
});
