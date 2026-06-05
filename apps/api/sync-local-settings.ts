import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildAzuriteConnectionString, getAzuritePorts, getMongoPort, replaceUrlPort, resolveWorkspaceRoot, syncJsonFile } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const workspaceRoot = resolveWorkspaceRoot();
const appDir = process.cwd();
const env = process.env;
const isE2E = ['1', 'true', 'yes'].includes((env['E2E'] ?? '').toLowerCase());
const localSettingsPath = path.join(appDir, 'local.settings.json');
const e2eLocalSettingsPath = path.join(appDir, 'local-settings.e2e.json');
const targetPath = path.join(appDir, 'deploy', 'local.settings.json');

if (!isE2E) {
	if (!existsSync(localSettingsPath)) {
		process.exit(0);
	}

	syncJsonFile({
		sourcePath: localSettingsPath,
		targetPath,
	});
	process.exit(0);
}

const urls = buildOcomUrls({ env, workspaceRoot });
const worktreeName = env['WORKTREE_NAME'];
const ports = getAzuritePorts(worktreeName);

syncJsonFile({
	sourcePath: e2eLocalSettingsPath,
	targetPath,
	transform: (document) => {
		const settings = document;
		const values = { ...(settings.Values ?? {}) };
		const accountName = String(values['STORAGE_ACCOUNT_NAME'] ?? '');
		const accountKey = String(values['STORAGE_ACCOUNT_KEY'] ?? '');

		values['ACCOUNT_PORTAL_OIDC_ISSUER'] = urls.mockCommunityAuthorityUrl;
		values['ACCOUNT_PORTAL_OIDC_ENDPOINT'] = urls.mockCommunityJwksUrl;
		values['STAFF_PORTAL_OIDC_ISSUER'] = urls.mockStaffAuthorityUrl;
		values['STAFF_PORTAL_OIDC_ENDPOINT'] = urls.mockStaffJwksUrl;

		if (accountName && accountKey && worktreeName) {
			const azuriteConnectionString = buildAzuriteConnectionString({
				accountKey,
				accountName,
				ports,
			});
			values['AZURE_STORAGE_CONNECTION_STRING'] = azuriteConnectionString;
			values['AzureWebJobsStorage'] = azuriteConnectionString;
		}

		const cosmosConnectionString = env['COSMOSDB_CONNECTION_STRING'] ?? values['COSMOSDB_CONNECTION_STRING'];
		if (typeof cosmosConnectionString === 'string' && cosmosConnectionString) {
			values['COSMOSDB_CONNECTION_STRING'] = worktreeName ? replaceUrlPort(cosmosConnectionString, getMongoPort(worktreeName)) : cosmosConnectionString;
		}

		return {
			...settings,
			Values: values,
		};
	},
});
