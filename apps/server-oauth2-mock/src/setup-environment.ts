import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';

export interface MockOidcConfig {
	name: string;
	baseUrl: string;
	clientId: string;
	redirectUri: string;
	claims: Record<string, string>;
}

export interface PortalOidcConfig extends MockOidcConfig {
	port: number;
}

export function setupEnvironment(): void {
	// Load mock server environment (PORT_BASE etc.) and allow local overrides
	dotenv.config();
	dotenv.config({ path: '.env.local', override: true });
}

export function discoverPortalConfigs(appsDir: string, portBase: number): PortalOidcConfig[] {
	const entries = fs.readdirSync(appsDir, { withFileTypes: true });
	const portals: PortalOidcConfig[] = [];
	let portOffset = 0;

	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (!entry.isDirectory() || !entry.name.startsWith('ui-')) continue;

		const mockOidcPath = path.join(appsDir, entry.name, 'mock-oidc.json');
		if (!fs.existsSync(mockOidcPath)) continue;

		let config: MockOidcConfig;
		try {
			const parsed = JSON.parse(fs.readFileSync(mockOidcPath, 'utf-8')) as unknown;
			// runtime validation of shape
			if (!isValidMockOidcConfig(parsed)) {
				console.warn(`[server-oauth2-mock] Skipping ${entry.name}: mock-oidc.json missing required fields (name, baseUrl, clientId, redirectUri, claims)`);
				continue;
			}
			config = parsed;
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

		portals.push({ ...config, port: portBase + portOffset });
		portOffset++;
	}

	return portals;
}

function isValidMockOidcConfig(config: unknown): config is MockOidcConfig {
	if (typeof config !== 'object' || config === null) return false;
	const c = config as Record<string, unknown>;
	return typeof c['name'] === 'string' && typeof c['baseUrl'] === 'string' && typeof c['clientId'] === 'string' && typeof c['redirectUri'] === 'string' && typeof c['claims'] === 'object' && c['claims'] !== null;
}
