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
	claims: Record<string, unknown>;
}

// Resolved config after reading the UI app's .env
export interface PortalOidcConfig {
	name: string;
	clientId: string;
	redirectUri: string;
	claims: Record<string, unknown>;
}

export function discoverPortalConfigs(appsDir: string): PortalOidcConfig[] {
	const entries = safeReadAppsDir(appsDir);
	const portals: PortalOidcConfig[] = [];

	for (const entry of entries) {
		if (!isUiAppDir(entry)) continue;
		const { name } = entry;

		const config = loadMockOidcConfig(appsDir, name);
		if (!config) continue;

		const appDir = path.join(appsDir, name);
		const parsedEnv = loadAppEnv(appDir, name);
		if (!parsedEnv) continue;

		const portal = buildPortalFromConfig(config, parsedEnv, name);
		if (!portal) continue;

		portals.push(portal);
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

function loadMockOidcConfig(appsDir: string, entryName: string): MockOidcConfig | undefined {
	const mockOidcPath = path.join(appsDir, entryName, 'mock-oidc.json');
	if (!fs.existsSync(mockOidcPath)) return undefined;

	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(mockOidcPath, 'utf-8')) as unknown;
	} catch (err) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: invalid mock-oidc.json`, err);
		return undefined;
	}

	if (!isValidMockOidcConfig(parsed)) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: mock-oidc.json missing required fields (name, envVars, claims)`);
		return undefined;
	}

	let config = parsed;

	if (!SAFE_NAME_RE.test(config.name)) {
		console.warn(`[server-oauth2-mock] Skipping "${entryName}": invalid portal name "${config.name}" in ${mockOidcPath} — must contain letters, digits, '_' and '-' only`);
		return undefined;
	}

	// Merge local overrides if present (gitignored mock-oidc.local.json)
	const localPath = path.join(appsDir, entryName, 'mock-oidc.local.json');
	if (fs.existsSync(localPath)) {
		try {
			const local = JSON.parse(fs.readFileSync(localPath, 'utf-8')) as Partial<MockOidcConfig>;
			if (local.claims) {
				config = { ...config, claims: { ...config.claims, ...local.claims } };
			}
		} catch (err) {
			console.warn(`[server-oauth2-mock] Could not parse mock-oidc.local.json for ${entryName}`, err);
		}
	}

	return config;
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

function buildPortalFromConfig(config: MockOidcConfig, parsedEnv: Record<string, string>, entryName: string): PortalOidcConfig | null {
	const clientIdVar = config.envVars.clientId;
	const redirectUriVar = config.envVars.redirectUri;

	const clientId = parsedEnv[clientIdVar];
	const redirectUri = parsedEnv[redirectUriVar];

	if (!clientId) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: env var ${clientIdVar} not found in .env`);
		return null;
	}

	if (!redirectUri) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: env var ${redirectUriVar} not found in .env`);
		return null;
	}

	return { name: config.name, clientId, redirectUri, claims: config.claims };
}

function isValidMockOidcConfig(config: unknown): config is MockOidcConfig {
	if (typeof config !== 'object' || config === null) return false;
	const c = config as { name?: unknown; envVars?: unknown; claims?: unknown };
	if (typeof c.name !== 'string') return false;
	if (typeof c.envVars !== 'object' || c.envVars === null) return false;
	const env = c.envVars as { clientId?: unknown; redirectUri?: unknown };
	if (typeof env.clientId !== 'string' || typeof env.redirectUri !== 'string') return false;
	if (typeof c.claims !== 'object' || c.claims === null || Array.isArray(c.claims)) return false;
	return true;
}
