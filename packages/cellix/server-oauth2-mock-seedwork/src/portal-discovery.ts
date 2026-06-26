import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { SAFE_NAME_RE } from './utils.ts';

/**
 * Env var name prefixes that conform to the project's VITE_* naming convention.
 * Used by {@link buildPortalFromConfig} to warn on non-conforming names and by the
 * warning message to surface the expected prefixes without duplicating the list.
 */
const CONFORMING_VITE_PREFIXES = ['VITE_APP_', 'VITE_COMMON_'] as const;

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

/**
 * Options for {@link discoverPortalConfigs}.
 */
export interface DiscoverPortalConfigsOptions {
	/**
	 * Environment variable lookup used when resolving `clientId` and `redirectUri` values.
	 * Defaults to `process.env`. Inject a custom object in tests or container deployments
	 * where `.env` files are absent and all configuration lives in the environment.
	 *
	 * @example
	 * ```ts
	 * discoverPortalConfigs('/apps', {
	 *   env: { VITE_APP_COMMUNITY_B2C_CLIENTID: 'my-client', VITE_APP_COMMUNITY_B2C_REDIRECT_URI: 'https://...' },
	 * });
	 * ```
	 */
	env?: Record<string, string | undefined>;
}

/**
 * Resolved OIDC portal configuration after reading a `ui-*` application's `.env`.
 *
 * Returned by {@link discoverPortalConfigs} for each successfully resolved portal entry.
 */
export interface PortalOidcConfig {
	/** Computed registration name: `<dir-without-ui-prefix>-<config.name>` (e.g. `community-end-user`). */
	name: string;
	/** The originating `ui-*` directory name (e.g. `ui-community`). */
	dirName: string;
	/** Resolved OAuth2 client identifier read from the app's `.env` or `process.env`. */
	clientId: string;
	/** Resolved OAuth2 redirect URI read from the app's `.env` or `process.env`. */
	redirectUri: string;
	/** Optional OIDC claims to pre-populate on the mock token (e.g. `sub`, `email`). */
	claims?: Record<string, unknown>;
}

/**
 * Scans `appsDir` for `ui-*` subdirectories and returns a resolved {@link PortalOidcConfig}
 * for each valid `mock-oidc.json` entry found.
 *
 * For each `ui-*` directory the function:
 * 1. Reads `mock-oidc.json` — accepts a single config object or an array of objects.
 * 2. Merges `.env` and `.env.local` (`.env.local` takes precedence).
 * 3. Resolves `clientId` and `redirectUri` env var names from `.env` or the injected
 *    `options.env` (defaults to `process.env`; injected env takes precedence to allow
 *    worktree-scoped or test overrides).
 * 4. Computes a registration name as `<dir-without-ui-prefix>-<config.name>`.
 *
 * Invalid entries, unresolvable vars, duplicate or unsafe registration names are skipped
 * with a `console.warn`; all remaining entries continue to be processed. When neither
 * `.env` nor `.env.local` exists for a `ui-*` directory, or when the files cannot be
 * read, discovery still runs using `options.env` / `process.env` only (a warning is
 * emitted and the portal is not skipped).
 * Env var names that do not follow the {@link CONFORMING_VITE_PREFIXES} convention produce
 * at most one warning per `discoverPortalConfigs` call across all portals, to avoid log
 * spam when multiple legacy configs are present.
 *
 * @param appsDir - Absolute path to the directory containing `ui-*` app subdirectories.
 * @param options - Optional configuration; see {@link DiscoverPortalConfigsOptions}.
 * @returns Array of resolved portal configs ordered alphabetically by `ui-*` directory name.
 *
 * @example
 * ```ts
 * import { discoverPortalConfigs } from '@cellix/server-oauth2-mock-seedwork';
 *
 * const portals = discoverPortalConfigs('/repo/apps');
 * for (const portal of portals) {
 *   console.log(portal.name, portal.clientId, portal.redirectUri);
 * }
 * ```
 */
export function discoverPortalConfigs(appsDir: string, options?: DiscoverPortalConfigsOptions): PortalOidcConfig[] {
	const entries = safeReadAppsDir(appsDir);
	const portals: PortalOidcConfig[] = [];
	const seenNames = new Set<string>();
	const nonConformingWarnedEntries = new Set<string>();
	const resolvedEnv: Record<string, string | undefined> = options?.env ?? process.env;

	for (const entry of entries) {
		if (!isUiAppDir(entry)) continue;
		const { name } = entry;

		const configs = loadMockOidcConfigs(appsDir, name);
		if (!configs || configs.length === 0) continue;

		const appDir = path.join(appsDir, name);
		const effectiveParsedEnv = loadAppEnv(appDir, name);

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

			const portal = buildPortalFromConfig(config, effectiveParsedEnv, name, nonConformingWarnedEntries, resolvedEnv);
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

function loadAppEnv(appDir: string, entryName: string): Record<string, string> {
	const envPath = path.join(appDir, '.env');
	const envLocalPath = path.join(appDir, '.env.local');
	if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
		console.warn(`[server-oauth2-mock] No .env files found for "${entryName}"; resolving env vars from configured env only`);
		return {};
	}

	let parsedEnv: Record<string, string> = {};
	parsedEnv = { ...parsedEnv, ...readEnvFile(envPath) };
	parsedEnv = { ...parsedEnv, ...readEnvFile(envLocalPath) };
	return parsedEnv;
}

function isLikelyViteEnvVarName(name: string): boolean {
	return CONFORMING_VITE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function buildPortalFromConfig(config: MockOidcConfig, parsedEnv: Record<string, string>, entryName: string, warnedNonConformingEntries: Set<string>, env: Record<string, string | undefined>): PortalOidcConfig | null {
	const clientIdVar = config.envVars.clientId;
	const redirectUriVar = config.envVars.redirectUri;

	// Validate env var naming (best-effort). Warn at most once per app directory to ensure
	// every directory with legacy names gets exactly one warning, without per-config spam.
	if (!isLikelyViteEnvVarName(clientIdVar) || !isLikelyViteEnvVarName(redirectUriVar)) {
		if (!warnedNonConformingEntries.has(entryName)) {
			warnedNonConformingEntries.add(entryName);
			console.warn(
				`[server-oauth2-mock] Warning: mock-oidc.json for "${entryName}" (config: "${config.name}") uses non-conforming env var names (expected ${CONFORMING_VITE_PREFIXES.map((p) => `${p}*`).join(' or ')}, got "${clientIdVar}" and "${redirectUriVar}"). ` +
					`Discovery will still attempt to resolve these names but please consider renaming to follow project conventions.`,
			);
		}
	}

	// Injected env takes precedence — allows worktree-scoped overrides and test injection
	const clientId = env[clientIdVar] ?? parsedEnv[clientIdVar];
	const redirectUri = env[redirectUriVar] ?? parsedEnv[redirectUriVar];

	if (!clientId) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: env var ${clientIdVar} not found in .env or configured env`);
		return null;
	}

	if (!redirectUri) {
		console.warn(`[server-oauth2-mock] Skipping ${entryName}: env var ${redirectUriVar} not found in .env or configured env`);
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
