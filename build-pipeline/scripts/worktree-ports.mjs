import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Worktree-scoped port computation for service isolation.
 *
 * When WORKTREE_NAME is set, each worktree gets a deterministic port offset
 * so MongoDB and Azurite instances don't collide between worktrees.
 *
 * Default worktree (no WORKTREE_NAME): uses base ports (50000, 10000–10002).
 * Named worktree: base + deterministic offset derived from the name's hash.
 *
 * Collision safety: the unset case always returns 0, and any named worktree
 * always returns ≥ 100, so the default worktree can never collide with a
 * named one. With 49 buckets the chance of two *named* worktrees colliding
 * is ~2% per pair — acceptable for the typical 1–3 concurrent worktrees.
 */

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const apiLocalSettingsPaths = [path.join(workspaceRoot, 'apps', 'api', 'deploy', 'local.settings.json'), path.join(workspaceRoot, 'apps', 'api', 'local.settings.json')];
let apiLocalSettingsValues;

function getSetting(name) {
	return process.env[name] ?? getApiLocalSetting(name);
}

function getApiLocalSetting(name) {
	apiLocalSettingsValues ??= readApiLocalSettingsValues();
	return apiLocalSettingsValues[name];
}

function readApiLocalSettingsValues() {
	for (const settingsPath of apiLocalSettingsPaths) {
		if (!fs.existsSync(settingsPath)) continue;
		const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
		return settings.Values ?? {};
	}
	return {};
}

/**
 * Returns a deterministic port offset in the range [100, 4900] (step 100)
 * for the current worktree. Returns 0 when WORKTREE_NAME is not set.
 */
export function getWorktreePortOffset() {
	const name = process.env.WORKTREE_NAME;
	if (!name) return 0;
	let hash = 0;
	for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
	return ((Math.abs(hash) % 49) + 1) * 100;
}

/** MongoDB port for the current worktree. */
export function getMongoPort() {
	return 50000 + getWorktreePortOffset();
}

/** Azurite blob/queue/table ports for the current worktree. */
export function getAzuritePorts() {
	const offset = getWorktreePortOffset();
	return {
		blob: 10000 + offset,
		queue: 10001 + offset,
		table: 10002 + offset,
	};
}

/**
 * Azurite connection string for worktree-specific ports.
 * Returns `UseDevelopmentStorage=true` for the default worktree (port 10000).
 */
export function getAzuriteConnectionString() {
	const ports = getAzuritePorts();
	if (ports.blob === 10000) return 'UseDevelopmentStorage=true';
	const accountName = getSetting('STORAGE_ACCOUNT_NAME');
	const accountKey = getSetting('STORAGE_ACCOUNT_KEY');
	if (!accountName || !accountKey) {
		throw new Error('[worktree-ports] STORAGE_ACCOUNT_NAME and STORAGE_ACCOUNT_KEY must be set to build a worktree Azurite connection string');
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
 * MongoDB connection string with the worktree-specific port patched in.
 * Reads COSMOSDB_CONNECTION_STRING from env or local.settings.json and replaces
 * the host:port segment.
 */
export function getMongoConnectionString() {
	const base = getSetting('COSMOSDB_CONNECTION_STRING');
	if (!base) throw new Error('[worktree-ports] COSMOSDB_CONNECTION_STRING must be set');
	return base.replace(/127\.0\.0\.1:\d+/, `127.0.0.1:${getMongoPort()}`);
}
