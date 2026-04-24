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

export function setupEnvironment(): void {
	// Load mock server environment and allow local overrides
	dotenv.config();
	dotenv.config({ path: '.env.local', override: true });
}

export function discoverPortalConfigs(appsDir: string): PortalOidcConfig[] {
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(appsDir, { withFileTypes: true });
	} catch (error) {
		console.warn(`[server-oauth2-mock] Warning: failed to read apps directory "${appsDir}"; returning no portals.`, error);
		return [];
	}
	const portals: PortalOidcConfig[] = [];

	for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
		if (!entry.isDirectory() || !entry.name.startsWith('ui-')) continue;

		const mockOidcPath = path.join(appsDir, entry.name, 'mock-oidc.json');
		if (!fs.existsSync(mockOidcPath)) continue;

		let config: MockOidcConfig;
		try {
			const parsed = JSON.parse(fs.readFileSync(mockOidcPath, 'utf-8')) as unknown;
			// runtime validation of shape
			if (!isValidMockOidcConfig(parsed)) {
				console.warn(`[server-oauth2-mock] Skipping ${entry.name}: mock-oidc.json missing required fields (name, envVars, claims)`);
				continue;
			}
			config = parsed;

			// Validate portal name early to avoid aborting startup for all portals due
			// to a single misconfigured file. The register() call will re-validate
			// defensively as well, but we prefer an early, descriptive warning here.
			if (!SAFE_NAME_RE.test(config.name)) {
				console.warn(`[server-oauth2-mock] Skipping "${entry.name}": invalid portal name "${config.name}" in ${mockOidcPath} — must contain letters, digits, '_' and '-' only`);
				continue;
			}
		} catch (err) {
			console.warn(`[server-oauth2-mock] Skipping ${entry.name}: invalid mock-oidc.json`, err);
			continue;
		}

		// Merge local overrides if present (gitignored mock-oidc.local.json)
		const localPath = path.join(appsDir, entry.name, 'mock-oidc.local.json');
		if (fs.existsSync(localPath)) {
			try {
				const local = JSON.parse(fs.readFileSync(localPath, 'utf-8')) as Partial<MockOidcConfig>;
				if (local.claims) {
					config = { ...config, claims: { ...config.claims, ...local.claims } };
				}
			} catch (err) {
				console.warn(`[server-oauth2-mock] Could not parse mock-oidc.local.json for ${entry.name}`, err);
			}
		}

		// Read the UI app's .env to resolve env vars. Also merge .env.local on top if present
		const appDir = path.join(appsDir, entry.name);
		const envPath = path.join(appDir, '.env');
		const envLocalPath = path.join(appDir, '.env.local');
		if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
			console.warn(`[server-oauth2-mock] Skipping ${entry.name}: .env not found`);
			continue;
		}

		let parsedEnv: Record<string, string> = {};
		try {
			parsedEnv = { ...parsedEnv, ...readEnvFile(envPath) };
			parsedEnv = { ...parsedEnv, ...readEnvFile(envLocalPath) };
		} catch (err) {
			console.warn(`[server-oauth2-mock] Skipping ${entry.name}: failed to read .env`, err);
			continue;
		}

		const clientIdVar = config.envVars.clientId;
		const redirectUriVar = config.envVars.redirectUri;

		const clientId = parsedEnv[clientIdVar];
		const redirectUri = parsedEnv[redirectUriVar];

		if (!clientId) {
			console.warn(`[server-oauth2-mock] Skipping ${entry.name}: env var ${clientIdVar} not found in .env`);
			continue;
		}

		if (!redirectUri) {
			console.warn(`[server-oauth2-mock] Skipping ${entry.name}: env var ${redirectUriVar} not found in .env`);
			continue;
		}

		portals.push({ name: config.name, clientId, redirectUri, claims: config.claims });
	}

	return portals;
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
