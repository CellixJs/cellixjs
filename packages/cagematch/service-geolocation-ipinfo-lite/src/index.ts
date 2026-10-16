import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';

interface IpInfoLiteResponse {
	readonly country_code?: unknown;
	readonly country?: unknown;
}

/** Configuration for the IPinfo Lite country-level API. */
export interface IpInfoLiteOptions {
	/** IPinfo API token. Keep it in server-side secret configuration. */
	readonly token: string;
	/** Request timeout in milliseconds. Defaults to 3000. */
	readonly timeoutMs?: number;
}

function optionalString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const normalized = value.trim();
	return normalized && normalized !== '-' && normalized !== '?' ? normalized : undefined;
}

function mapResponse(response: IpInfoLiteResponse): GeolocationLookupResult | null {
	const countryCode = optionalString(response.country_code);
	const countryName = optionalString(response.country);
	if (!countryCode && !countryName) {
		return null;
	}
	return {
		provider: 'ipinfo-lite',
		...(countryCode ? { countryCode } : {}),
		...(countryName ? { countryName } : {}),
	};
}

/**
 * Looks up country-level IP information using the free IPinfo Lite HTTPS API.
 * Lite returns country and continent fields plus basic ASN details; this adapter
 * maps only country fields because those are the fields in the shared contract.
 *
 * @example
 * ```ts
 * const service = new ServiceGeolocationIpInfoLite({ token: process.env.GEOLOCATION_IPINFO_LITE_TOKEN! });
 * await service.startUp();
 * const result = await service.lookup('8.8.8.8');
 * console.info(result?.countryCode, result?.countryName);
 * ```
 *
 * @throws When the token is empty, the IP is invalid, the service is not started,
 * or IPinfo returns a non-success response other than 404.
 */
export class ServiceGeolocationIpInfoLite implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'ipinfo-lite';
	private readonly options: Required<IpInfoLiteOptions>;
	private readonly fetcher: typeof fetch;
	private started = false;

	/** Creates the Lite API adapter with a server-side token and optional timeout. */
	public constructor(options: IpInfoLiteOptions, fetcher: typeof fetch = fetch) {
		if (!options.token.trim()) {
			throw new Error('IPinfo Lite token is required');
		}
		this.options = { token: options.token.trim(), timeoutMs: options.timeoutMs ?? 3000 };
		this.fetcher = fetcher;
	}

	/** Marks the adapter ready for requests. */
	public startUp(): Promise<GeolocationService> {
		this.started = true;
		return Promise.resolve(this);
	}

	/** Marks the adapter unavailable for requests. */
	public shutDown(): Promise<void> {
		this.started = false;
		return Promise.resolve();
	}

	/** Looks up an IPv4 or IPv6 address and returns country fields when known. */
	public async lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			throw new Error('A valid IPv4 or IPv6 address is required');
		}
		if (!this.started) {
			throw new Error('IPinfo Lite geolocation service is not started');
		}

		const response = await this.fetcher(`https://api.ipinfo.io/lite/${encodeURIComponent(ip)}`, {
			headers: { accept: 'application/json', authorization: `Bearer ${this.options.token}` },
			signal: AbortSignal.timeout(this.options.timeoutMs),
		});
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`IPinfo Lite lookup failed with status ${response.status}`);
		}

		const body: unknown = await response.json();
		if (body === null || typeof body !== 'object' || Array.isArray(body)) {
			throw new Error('IPinfo Lite lookup returned an invalid response');
		}
		return mapResponse(body as IpInfoLiteResponse);
	}
}
