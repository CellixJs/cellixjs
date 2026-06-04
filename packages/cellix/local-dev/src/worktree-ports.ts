import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { type ResolveWorkspaceRootOptions, resolveWorkspaceRoot } from './workspace.ts';

type SettingsValues = Record<string, string>;

export interface AzuritePorts {
	blob: number;
	queue: number;
	table: number;
}

export interface ConnectionStringOptions extends ResolveWorkspaceRootOptions {
	env?: NodeJS.ProcessEnv;
	values?: SettingsValues;
}

function readApiLocalSettingsValues(workspaceRoot: string): SettingsValues {
	const candidatePaths = [path.join(workspaceRoot, 'apps', 'api', 'deploy', 'local.settings.json'), path.join(workspaceRoot, 'apps', 'api', 'local.settings.json')];

	for (const settingsPath of candidatePaths) {
		if (!existsSync(settingsPath)) continue;
		const settings = JSON.parse(readFileSync(settingsPath, 'utf8')) as {
			Values?: SettingsValues;
		};
		return settings.Values ?? {};
	}

	return {};
}

function getSetting(name: string, options: ConnectionStringOptions, workspaceRoot: string): string | undefined {
	return options.env?.[name] ?? options.values?.[name] ?? readApiLocalSettingsValues(workspaceRoot)[name];
}

/**
 * Returns a deterministic worktree port offset in increments of 100.
 */
export function getWorktreePortOffset(worktreeName = process.env['WORKTREE_NAME']): number {
	if (!worktreeName) return 0;

	let hash = 0;
	for (const char of worktreeName) {
		hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
	}

	return ((Math.abs(hash) % 49) + 1) * 100;
}

/**
 * Returns the MongoDB port for the current worktree.
 */
export function getMongoPort(worktreeName = process.env['WORKTREE_NAME']): number {
	return 50000 + getWorktreePortOffset(worktreeName);
}

/**
 * Returns the Azurite ports for the current worktree.
 */
export function getAzuritePorts(worktreeName = process.env['WORKTREE_NAME']): AzuritePorts {
	const offset = getWorktreePortOffset(worktreeName);

	return {
		blob: 10000 + offset,
		queue: 10001 + offset,
		table: 10002 + offset,
	};
}

/**
 * Returns the Azurite connection string for the current worktree.
 */
export function getAzuriteConnectionString(options: ConnectionStringOptions = {}): string {
	const workspaceRoot = resolveWorkspaceRoot(options);
	const ports = getAzuritePorts(options.env?.['WORKTREE_NAME'] ?? process.env['WORKTREE_NAME']);
	if (ports.blob === 10000) return 'UseDevelopmentStorage=true';

	const accountName = getSetting('STORAGE_ACCOUNT_NAME', options, workspaceRoot);
	const accountKey = getSetting('STORAGE_ACCOUNT_KEY', options, workspaceRoot);
	if (!accountName || !accountKey) {
		throw new Error('[local-dev] STORAGE_ACCOUNT_NAME and STORAGE_ACCOUNT_KEY must be set to build a worktree Azurite connection string');
	}

	return [
		'DefaultEndpointsProtocol=http',
		`AccountName=${accountName}`,
		`AccountKey=${accountKey}`,
		`BlobEndpoint=http://127.0.0.1:${ports.blob}/${accountName}`,
		`QueueEndpoint=http://127.0.0.1:${ports.queue}/${accountName}`,
		`TableEndpoint=http://127.0.0.1:${ports.table}/${accountName}`,
	].join(';');
}

/**
 * Reads the API Mongo connection string and patches in the worktree-specific port.
 */
export function getMongoConnectionString(options: ConnectionStringOptions = {}): string {
	const workspaceRoot = resolveWorkspaceRoot(options);
	const base = getSetting('COSMOSDB_CONNECTION_STRING', options, workspaceRoot);
	if (!base) {
		throw new Error('[local-dev] COSMOSDB_CONNECTION_STRING must be set');
	}

	const url = new URL(base);
	url.port = String(getMongoPort(options.env?.['WORKTREE_NAME'] ?? process.env['WORKTREE_NAME']));
	return url.toString();
}
