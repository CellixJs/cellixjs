/// <reference types="node" />
import { NodeDevRunner, resolveAzureFunctionsLocalSettingsValues } from '@cellix/local-dev';
import { buildOcomApiLocalSettings } from '@ocom/local-dev-config';

// Reuse the api's Azurite storage settings, scoped to the active worktree, so
// the worker reads the same local queue and blobs the api writes.
const apiSettings = resolveAzureFunctionsLocalSettingsValues(buildOcomApiLocalSettings());

new NodeDevRunner({
	settings: {
		WORKER_MODE: 'loop',
		AZURE_STORAGE_ACCOUNT_NAME: apiSettings['AZURE_STORAGE_ACCOUNT_NAME'],
		AZURE_STORAGE_CONNECTION_STRING: apiSettings['AZURE_STORAGE_CONNECTION_STRING'],
	},
}).start();
