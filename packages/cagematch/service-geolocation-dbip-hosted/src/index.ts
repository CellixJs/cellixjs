import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';

interface DbIpResponse {
	readonly countryCode?: unknown;
	readonly countryName?: unknown;
	readonly stateProv?: unknown;
	readonly city?: unknown;
	readonly latitude?: unknown;
	readonly longitude?: unknown;
	readonly errorCode?: unknown;
	readonly error?: unknown;
}

/** A fetch-compatible function used to make a DB-IP request. */
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** Configuration for a DB-IP hosted API lookup service. */
export interface DbIpHostedOptions {
	/** DB-IP API key, supplied through server-side configuration. */
	readonly apiKey: string;
	/** Request timeout in milliseconds. Defaults to 3000. */
	readonly timeoutMs?: number;
}

function mapResponse(response: DbIpResponse): GeolocationLookupResult {
	return {
		provider: 'dbip-hosted',
		...(typeof response.countryCode === 'string' ? { countryCode: response.countryCode } : {}),
		...(typeof response.countryName === 'string' ? { countryName: response.countryName } : {}),
		...(typeof response.stateProv === 'string' ? { region: response.stateProv } : {}),
		...(typeof response.city === 'string' ? { city: response.city } : {}),
		...(typeof response.latitude === 'number' ? { latitude: response.latitude } : {}),
		...(typeof response.longitude === 'number' ? { longitude: response.longitude } : {}),
	};
}

/**
 * Hosted DB-IP geolocation adapter using the DB-IP v2 HTTPS API.
 *
 * @example
 * ```ts
 * const service = new ServiceGeolocationDbIpHosted({ apiKey: process.env.DBIP_API_KEY ?? '' });
 * await service.startUp();
 * const location = await service.lookup('198.51.100.42');
 * ```
 */
export class ServiceGeolocationDbIpHosted implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'dbip-hosted';
	private readonly options: Required<DbIpHostedOptions>;
	private readonly fetcher: FetchLike;
	private started = false;

	/**
	 * Creates the hosted adapter.
	 *
	 * @param options - API key and optional request timeout.
	 * @param fetcher - Fetch-compatible implementation; defaults to the runtime's built-in `fetch`.
	 * @throws When the API key is empty.
	 */
	constructor(options: DbIpHostedOptions, fetcher: FetchLike = fetch) {
		if (!options.apiKey.trim()) {
			throw new Error('DB-IP API key is required');
		}
		this.options = { apiKey: options.apiKey.trim(), timeoutMs: options.timeoutMs ?? 3000 };
		this.fetcher = fetcher;
	}

	/** Marks the adapter ready to serve lookups. */
	public startUp(): Promise<GeolocationService> {
		this.started = true;
		return Promise.resolve(this);
	}

	/** Marks the adapter unavailable for lookups. */
	public shutDown(): Promise<void> {
		this.started = false;
		return Promise.resolve();
	}

	/**
	 * Looks up an IPv4 or IPv6 address through DB-IP and normalizes its location fields.
	 *
	 * @param ip - Address to look up.
	 * @returns The normalized location, or `null` when DB-IP returns HTTP 404.
	 * @throws For invalid addresses, calls made before startup, or provider/API errors.
	 */
	public async lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			throw new Error('A valid IPv4 or IPv6 address is required');
		}
		if (!this.started) {
			throw new Error('DB-IP hosted geolocation service is not started');
		}

		const url = `https://api.db-ip.com/v2/${encodeURIComponent(this.options.apiKey)}/${encodeURIComponent(ip)}`;
		const response = await this.fetcher(url, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(this.options.timeoutMs),
		});
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`DB-IP lookup failed with status ${response.status}`);
		}

		const body: unknown = await response.json();
		if (body === null || typeof body !== 'object' || Array.isArray(body)) {
			throw new Error('DB-IP lookup returned an invalid response');
		}
		const data = body as DbIpResponse;
		if (typeof data.errorCode === 'string') {
			throw new Error(`DB-IP lookup failed (${data.errorCode}): ${typeof data.error === 'string' ? data.error : 'provider error'}`);
		}
		return mapResponse(data);
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
