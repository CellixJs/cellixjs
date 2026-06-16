import { applyWorktreeSuffix, replaceUrlPort } from '../urls/index.ts';
import { getMongoPort, getWorktreePortOffset } from './ports.ts';
import type { KnownWorktreeSettings, SettingsRecord, WorktreeSettingsOptions } from './types.ts';
import { resolveWorktreeName } from './worktree-name.ts';

const HTTP_URL_PATTERN = /https?:\/\/[^\s;'"<>]+/g;
const MONGO_URL_PATTERN = /mongodb:\/\/[^\s;'"<>]+/g;

function isPlainRecord(value: unknown): value is SettingsRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyEnvValue(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return undefined;
}

function preservesBareOriginShape(originalValue: string, parsedUrl: URL): boolean {
	return !originalValue.endsWith('/') && parsedUrl.pathname === '/' && !parsedUrl.search && !parsedUrl.hash;
}

function transformUrl(urlValue: string, worktreeName: string | undefined): string {
	try {
		const url = new URL(urlValue);
		if (url.protocol === 'mongodb:') {
			return worktreeName ? replaceUrlPort(urlValue, getMongoPort(worktreeName)) : urlValue;
		}

		if (url.hostname) {
			url.hostname = applyWorktreeSuffix(url.hostname, worktreeName);
		}

		const transformedUrl = url.toString();
		if (preservesBareOriginShape(urlValue, url)) {
			return transformedUrl.slice(0, -1);
		}

		return transformedUrl;
	} catch {
		return urlValue;
	}
}

function transformStringValue(value: string, worktreeName: string | undefined): string {
	const withHttpUrls = value.replace(HTTP_URL_PATTERN, (match) => transformUrl(match, worktreeName));
	return withHttpUrls.replace(MONGO_URL_PATTERN, (match) => transformUrl(match, worktreeName));
}

function transformValue(value: unknown, worktreeName: string | undefined): unknown {
	if (typeof value === 'string') {
		return transformStringValue(value, worktreeName);
	}

	if (Array.isArray(value)) {
		return value.map((item) => transformValue(item, worktreeName));
	}

	if (isPlainRecord(value)) {
		return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, transformValue(entryValue, worktreeName)]));
	}

	return value;
}

/**
 * Applies deterministic worktree transforms to caller-provided local-dev
 * settings without knowing the consuming application's env-key policy.
 *
 * URL-like strings receive `.localhost` hostname suffixes, MongoDB URLs receive
 * worktree-specific ports, and `PORT` receives the generic worktree port offset.
 *
 * @example
 * ```ts
 * new WorktreeSettings({
 *   env: { WORKTREE_NAME: 'feature-a' },
 *   settings: {
 *     BASE_URL: 'https://ownercommunity.localhost:1355',
 *     COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
 *   },
 * }).toEnv();
 * ```
 */
export class WorktreeSettings {
	private readonly env: NodeJS.ProcessEnv;
	private readonly settings: SettingsRecord;
	private readonly worktreeName: string | undefined;

	public constructor(options: WorktreeSettingsOptions = {}) {
		this.env = options.env ?? process.env;
		this.settings = options.settings ?? {};
		this.worktreeName = resolveWorktreeName({ ...options, env: this.env });
	}

	/**
	 * Returns a process environment with transformed settings merged over the
	 * base env.
	 *
	 * Non-string, non-number, and non-boolean setting values are ignored because
	 * process environments can only carry strings.
	 *
	 * @returns A new environment object.
	 */
	public toEnv(): NodeJS.ProcessEnv {
		const transformedSettings = this.transformRecord(this.settings);
		return {
			...this.env,
			...Object.fromEntries(
				Object.entries(transformedSettings)
					.map(([key, value]) => [key, stringifyEnvValue(value)])
					.filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
			),
		};
	}

	/**
	 * Applies worktree transforms to a settings record while preserving its
	 * object shape.
	 *
	 * @param record - Settings object to transform.
	 * @returns A transformed copy of the provided record.
	 */
	public transformRecord<TRecord extends SettingsRecord>(record: TRecord): TRecord {
		const transformed = Object.fromEntries(Object.entries(record).map(([key, value]) => [key, transformValue(value, this.worktreeName)])) as KnownWorktreeSettings;

		if (typeof transformed.PORT === 'string' && this.worktreeName) {
			const port = Number(transformed.PORT);
			if (Number.isInteger(port)) {
				transformed.PORT = String(port + getWorktreePortOffset(this.worktreeName));
			}
		}

		return transformed as TRecord;
	}
}
