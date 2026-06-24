import fs from 'node:fs';
import path from 'node:path';
import { SAFE_NAME_RE } from '@cellix/server-oauth2-mock-seedwork';
import * as dotenv from 'dotenv';

function readEnvFile(filePath: string): Record<string, string> {
	try {
		if (!fs.existsSync(filePath)) return {};
		const contents = fs.readFileSync(filePath, 'utf-8');
		return dotenv.parse(contents);
	} catch (err) {
		console.warn(`[server-oauth2-mock] Warning: failed to read env file at "${filePath}"`, err);
		return {};
	}
}

interface MockOidcConfig {
	name: string;
	envVars: {
		clientId: string;
		redirectUri: string;
	};
	claims?: Record<string, unknown>;
}

// Resolved config after reading the UI app's .env
export interface PortalOidcConfig {
	name: string;
	dirName: string;
	clientId: string;
	redirectUri: string;
	claims?: Record<string, unknown>;
	// composed registration key: `${dirName}-${name}`
	registrationKey: string;
}

export function discoverPortalConfigs(appsDir: string): PortalOidcConfig[] {
	const entries = safeReadAppsDir(appsDir);
	const portals: PortalOidcConfig[] = [];
	const registrationMap = new Map<string, { portalDir: string; configName: string }>();

	for (const entry of entries) {
		if (!isUiAppDir(entry)) continue;
		const { name } = entry;

		const configs = loadMockOidcConfig(appsDir, name);
		if (!configs || configs.length === 0) continue;

		const appDir = path.join(appsDir, name);
		const parsedEnv = loadAppEnv(appDir, name);
		if (!parsedEnv) continue;

		for (const config of configs) {
			const portal = buildPortalFromConfig(config, parsedEnv, name);
			if (!portal) continue;

			const composedKey = `${name}-${portal.name}`;
			// Validate composed key
			if (!SAFE_NAME_RE.test(composedKey)) {
				throw new Error(`Invalid mock OIDC registration key '${composedKey}' composed from '${name}/${portal.name}'; registration keys must match ${SAFE_NAME_RE}`);
			}

			// Detect duplicates
			const existing = registrationMap.get(composedKey);
			if (existing) {
				throw new Error(`Duplicate mock OIDC registration key '${composedKey}' found: first in '${existing.portalDir}/${existing.configName}', also in '${name}/${portal.name}'. Rename the config.name to ensure uniqueness.`);
			}

			registrationMap.set(composedKey, { portalDir: name, configName: portal.name });
			portals.push({ ...portal, registrationKey: composedKey });
		}
	}

	return portals;
}

function safeReadAppsDir(appsDir: string): fs.Dirent[] {
	try {
		return fs.readdirSync(appsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
	} catch (error) {
		console.warn(`[server-oauth2-mock] Warning: failed to read apps directory "${appsDir}"; returning no portals.`, error);
		return [];
	}
}

function isUiAppDir(entry: fs.Dirent): boolean {
	return entry.isDirectory() && entry.name.startsWith('ui-');
}

function loadMockOidcConfig(appsDir: string, entryName: string): MockOidcConfig[] | undefined {
	const mockOidcPath = path.join(appsDir, entryName, 'mock-oidc.json');
	if (!fs.existsSync(mockOidcPath)) return undefined;

	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(mockOidcPath, 'utf-8')) as unknown;
	} catch (err) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: invalid mock-oidc.json`, err);
		return undefined;
	}

	// Accept either an array of configs or a single object (coerce) for compatibility
	let configs: unknown[];
	if (Array.isArray(parsed)) configs = parsed;
	else configs = [parsed];

	const validConfigs: MockOidcConfig[] = [];
	for (const candidate of configs) {
		if (!isValidMockOidcConfig(candidate)) {
			console.warn(`[server-oauth2-mock] Skipping ${entryName}: mock-oidc.json contains invalid entry (missing required fields or invalid claims)`);
			continue;
		}

		const cfg = candidate as MockOidcConfig;
		if (!SAFE_NAME_RE.test(cfg.name)) {
			console.warn(`[server-oauth2-mock] Skipping "${entryName}": invalid portal name "${cfg.name}" in ${mockOidcPath} — must contain letters, digits, '_' and '-' only`);
			continue;
		}

		validConfigs.push(cfg);
	}

	if (validConfigs.length === 0) return undefined;
	return validConfigs;
}

function loadAppEnv(appDir: string, entryName: string): Record<string, string> | null {
	const envPath = path.join(appDir, '.env');
	const envLocalPath = path.join(appDir, '.env.local');
	if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: .env not found`);
		return null;
	}

	try {
		let parsedEnv: Record<string, string> = {};
		parsedEnv = { ...parsedEnv, ...readEnvFile(envPath) };
		parsedEnv = { ...parsedEnv, ...readEnvFile(envLocalPath) };
		return parsedEnv;
	} catch (err) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: failed to read .env`, err);
		return null;
	}
}

function buildPortalFromConfig(config: MockOidcConfig, parsedEnv: Record<string, string>, entryName: string): Omit<PortalOidcConfig, 'registrationKey'> | null {
	const clientIdVar = config.envVars.clientId;
	const redirectUriVar = config.envVars.redirectUri;

	// Validate env var naming convention (warn-only)
	const canonicalPortal = entryName.toUpperCase().replace(/-/g, '_');
	const validateEnvKey = (key: string) => {
		if (key.startsWith('VITE_COMMON_')) return;
		if (key.startsWith(`VITE_APP_${canonicalPortal}_`)) return;
		console.warn(
			`[server-oauth2-mock] Env var key "${key}" in ${entryName}/${config.name} does not follow naming convention (expected VITE_APP_${canonicalPortal}_* or VITE_COMMON_*). See apps/docs/docs/decisions/0031-ui-env-vars.md`,
		);
	};
	validateEnvKey(clientIdVar);
	validateEnvKey(redirectUriVar);

	// process.env takes precedence — allows worktree-scoped overrides injected at startup
	const clientId = process.env[clientIdVar] ?? parsedEnv[clientIdVar];
	const redirectUri = process.env[redirectUriVar] ?? parsedEnv[redirectUriVar];

	if (!clientId) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}/${config.name}: env var ${clientIdVar} not found in .env or process.env`);
		return null;
	}

	if (!redirectUri) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}/${config.name}: env var ${redirectUriVar} not found in .env or process.env`);
		return null;
	}

	const base = { name: config.name, dirName: entryName, clientId, redirectUri };
	if (config.claims !== undefined) return { ...base, claims: config.claims };
	return base;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidMockOidcConfig(config: unknown): config is MockOidcConfig {
	if (!isPlainObject(config)) return false;
	const c = config as { name?: unknown; envVars?: unknown; claims?: unknown };
	if (typeof c.name !== 'string') return false;
	if (!isPlainObject(c.envVars)) return false;
	const env = c.envVars as { clientId?: unknown; redirectUri?: unknown };
	if (typeof env.clientId !== 'string' || typeof env.redirectUri !== 'string') return false;
	if ('claims' in c && c.claims !== undefined && !isPlainObject(c.claims)) return false;
	return true;
}
