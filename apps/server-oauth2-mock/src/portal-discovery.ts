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
}

export function discoverPortalConfigs(appsDir: string): PortalOidcConfig[] {
	const entries = safeReadAppsDir(appsDir);
	const portals: PortalOidcConfig[] = [];
	const seenNames = new Set<string>();

	for (const entry of entries) {
		if (!isUiAppDir(entry)) continue;
		const { name } = entry;

		const configs = loadMockOidcConfigs(appsDir, name);
		if (!configs || configs.length === 0) continue;

		const appDir = path.join(appsDir, name);
		const parsedEnv = loadAppEnv(appDir, name);
		if (!parsedEnv) continue;

		for (const config of configs) {
			// Compute registration name: strip ui- prefix from directory and combine with config name
			const portalDirNameWithoutUiPrefix = name.replace(/^ui-/, '');
			const registrationName = `${portalDirNameWithoutUiPrefix}-${config.name}`;

			if (!SAFE_NAME_RE.test(registrationName)) {
				console.warn(
					`[server-oauth2-mock] Skipping config element "${config.name}" in ${path.join(appsDir, name, 'mock-oidc.json')} — invalid computed registration name "${registrationName}" (must contain only letters, digits, '_' and '-'). Other elements in the same file will still be processed.`,
				);
				continue;
			}

			if (seenNames.has(registrationName)) {
				console.warn(`[server-oauth2-mock] Skipping duplicate registration name "${registrationName}" from ${path.join(appsDir, name, 'mock-oidc.json')}`);
				continue;
			}

			const portal = buildPortalFromConfig(config, parsedEnv, name);
			if (!portal) continue;

			// Replace portal.name with computed registrationName
			const finalPortal: PortalOidcConfig = { ...portal, name: registrationName };
			portals.push(finalPortal);
			seenNames.add(registrationName);
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

function loadMockOidcConfigs(appsDir: string, entryName: string): MockOidcConfig[] | undefined {
	const mockOidcPath = path.join(appsDir, entryName, 'mock-oidc.json');
	if (!fs.existsSync(mockOidcPath)) return undefined;

	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(mockOidcPath, 'utf-8')) as unknown;
	} catch (err) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: invalid mock-oidc.json`, err);
		return undefined;
	}

	// Accept either a single object (back-compat) or an array of objects
	if (Array.isArray(parsed)) {
		const configs: MockOidcConfig[] = [];
		for (const item of parsed) {
			if (!isValidMockOidcConfig(item)) {
				console.warn(`[server-oauth2-mock] Skipping an element in ${mockOidcPath}: element missing required fields or has invalid claims`);
				continue;
			}
			configs.push(item);
		}
		return configs;
	}

	if (!isValidMockOidcConfig(parsed)) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: mock-oidc.json missing required fields (name, envVars) or contains invalid claims`);
		return undefined;
	}

	return [parsed];
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

function isLikelyViteEnvVarName(name: string): boolean {
	return name.startsWith('VITE_APP_') || name.startsWith('VITE_COMMON_');
}

function buildPortalFromConfig(config: MockOidcConfig, parsedEnv: Record<string, string>, entryName: string): PortalOidcConfig | null {
	const clientIdVar = config.envVars.clientId;
	const redirectUriVar = config.envVars.redirectUri;

	// Validate env var naming sanity (best-effort). Emit a warning if names do not follow VITE_* conventions
	if (!isLikelyViteEnvVarName(clientIdVar) || !isLikelyViteEnvVarName(redirectUriVar)) {
		console.warn(
			`[server-oauth2-mock] Warning: mock-oidc.json for "${entryName}" (config: "${config.name}") uses non-conforming env var names (expected VITE_APP_* or VITE_COMMON_*, got "${clientIdVar}" and "${redirectUriVar}"). ` +
				`Discovery will still attempt to resolve these names but please consider renaming to follow project conventions.`,
		);
	}

	// process.env takes precedence — allows worktree-scoped overrides injected at startup
	const clientId = process.env[clientIdVar] ?? parsedEnv[clientIdVar];
	const redirectUri = process.env[redirectUriVar] ?? parsedEnv[redirectUriVar];

	if (!clientId) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: env var ${clientIdVar} not found in .env or process.env`);
		return null;
	}

	if (!redirectUri) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: env var ${redirectUriVar} not found in .env or process.env`);
		return null;
	}

	const base = { name: config.name, dirName: entryName, clientId, redirectUri };
	if (config.claims !== undefined) return { ...base, claims: config.claims };
	return base as PortalOidcConfig;
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
