/**
 * Default timeout map used by Cellix verification packages.
 */
export const defaultVerificationTimeouts = {
	/** Default Cucumber scenario timeout. */
	scenario: 120_000,

	/**
	 * Cold-boot timeout for the first `Before` hook, which starts every server
	 * (Mongo, Azurite, API, UI portals, mock auth) and launches the browser.
	 * Larger than {@link serverStartup} because a cold run also pays for func
	 * TypeScript compilation and Vite dependency pre-bundling; only the first
	 * scenario incurs it (later `Before`s reuse the running infrastructure).
	 */
	boot: 300_000,

	/** Server startup timeout. */
	serverStartup: 120_000,

	/** Graceful server shutdown timeout. */
	serverShutdown: 10_000,

	/** Health probe timeout. */
	healthProbe: 3_000,

	/** Health probe retry interval. */
	healthProbeInterval: 500,

	/** UI initialization timeout. */
	uiInit: 30_000,

	/** UI cleanup timeout. */
	uiCleanup: 10_000,
} as const;

/** Keys accepted by the default timeout map. */
export type DefaultVerificationTimeoutKey = keyof typeof defaultVerificationTimeouts;

/** Timeout map accepted by {@link VerificationTimeouts}. */
export type VerificationTimeoutMap = Record<string, number>;

/** Options used by {@link VerificationTimeouts}. */
export interface VerificationTimeoutOptions<TTimeouts extends VerificationTimeoutMap> {
	/** Default timeout values. */
	defaults: TTimeouts;

	/** Environment source. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
}

/**
 * Reads verification timeouts with optional environment overrides.
 *
 * Environment variable names are generated from keys: `serverStartup` becomes
 * `TIMEOUT_SERVER_STARTUP`.
 */
export class VerificationTimeouts<TTimeouts extends VerificationTimeoutMap = typeof defaultVerificationTimeouts> {
	private readonly defaults: TTimeouts;
	private readonly env: NodeJS.ProcessEnv;

	/**
	 * @param options Timeout defaults and optional environment source.
	 */
	constructor(options: VerificationTimeoutOptions<TTimeouts>) {
		this.defaults = options.defaults;
		this.env = options.env ?? process.env;
	}

	/**
	 * Get a timeout value, honoring a positive integer environment override.
	 *
	 * @param key Timeout key.
	 */
	get<TKey extends keyof TTimeouts & string>(key: TKey): TTimeouts[TKey] {
		const envName = timeoutEnvName(key);
		const envOverride = this.env[envName];

		if (envOverride) {
			const parsed = Number(envOverride);
			if (Number.isInteger(parsed) && parsed > 0) {
				return parsed as TTimeouts[TKey];
			}
		}

		return this.defaults[key];
	}
}

const defaultTimeoutReader = new VerificationTimeouts({ defaults: defaultVerificationTimeouts });

/**
 * Read a timeout from the default Cellix verification timeout map.
 *
 * @param key Timeout key.
 */
export function getTimeout(key: DefaultVerificationTimeoutKey): number {
	return defaultTimeoutReader.get(key);
}

function timeoutEnvName(key: string): string {
	return `TIMEOUT_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`;
}
