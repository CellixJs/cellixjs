import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';

interface Ip2LocationHostedResponse {
	readonly country_code?: unknown;
	readonly country_name?: unknown;
	readonly region_name?: unknown;
	readonly city_name?: unknown;
	readonly latitude?: unknown;
	readonly longitude?: unknown;
	readonly error?: unknown;
}

/** Fetch-compatible function used to call the IP2Location.io endpoint. */
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** Configuration for a hosted IP2Location.io lookup. */
export interface Ip2LocationHostedOptions {
	/** Optional IP2Location.io API key. Keyless access is subject to the provider's daily limit. */
	readonly apiKey?: string;
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

function optionalCoordinate(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapResponse(response: Ip2LocationHostedResponse): GeolocationLookupResult | null {
	const countryCode = optionalString(response.country_code);
	const countryName = optionalString(response.country_name);
	const region = optionalString(response.region_name);
	const city = optionalString(response.city_name);
	const latitude = optionalCoordinate(response.latitude);
	const longitude = optionalCoordinate(response.longitude);
	if (!countryCode && !countryName && !region && !city && latitude === undefined && longitude === undefined) {
		return null;
	}
	return {
		provider: 'ip2location-hosted',
		...(countryCode ? { countryCode } : {}),
		...(countryName ? { countryName } : {}),
		...(region ? { region } : {}),
		...(city ? { city } : {}),
		...(latitude !== undefined ? { latitude } : {}),
		...(longitude !== undefined ? { longitude } : {}),
	};
}

function getProviderError(value: unknown): string | undefined {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}
	const message = (value as { readonly error_message?: unknown }).error_message;
	return typeof message === 'string' && message.trim() ? message : 'IP2Location.io returned an API error';
}

/**
 * Hosted IP2Location.io adapter implementing the provider-neutral geolocation contract.
 *
 * @example
 * ```ts
 * const service = new ServiceGeolocationIp2LocationHosted({ apiKey: process.env.IP2LOCATION_API_KEY });
 * await service.startUp();
 * const location = await service.lookup('198.51.100.42');
 * ```
 */
export class ServiceGeolocationIp2LocationHosted implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'ip2location-hosted';
	private readonly options: Required<Ip2LocationHostedOptions>;
	private readonly fetcher: FetchLike;
	private started = false;

	/** Creates the hosted adapter with an optional API key, timeout, and fetch implementation. */
	constructor(options: Ip2LocationHostedOptions = {}, fetcher: FetchLike = fetch) {
		if (options.apiKey !== undefined && !options.apiKey.trim()) {
			throw new Error('IP2Location.io API key must not be empty');
		}
		this.options = {
			apiKey: options.apiKey?.trim() ?? '',
			timeoutMs: options.timeoutMs ?? 3000,
		};
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

	/** Looks up an IPv4 or IPv6 address and normalizes the provider's basic location fields. */
	public async lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			throw new Error('A valid IPv4 or IPv6 address is required');
		}
		if (!this.started) {
			throw new Error('IP2Location.io hosted geolocation service is not started');
		}

		const url = new URL('https://api.ip2location.io/');
		url.searchParams.set('ip', ip);
		url.searchParams.set('format', 'json');
		const headers: { accept: string; authorization?: string } = { accept: 'application/json' };
		if (this.options.apiKey) {
			headers.authorization = `Bearer ${this.options.apiKey}`;
		}
		const response = await this.fetcher(url.toString(), {
			headers,
			signal: AbortSignal.timeout(this.options.timeoutMs),
		});
		if (!response.ok) {
			throw new Error(`IP2Location.io lookup failed with status ${response.status}`);
		}

		const body: unknown = await response.json();
		if (body === null || typeof body !== 'object' || Array.isArray(body)) {
			throw new Error('IP2Location.io lookup returned an invalid response');
		}
		const data = body as Ip2LocationHostedResponse;
		const providerError = getProviderError(data.error);
		if (providerError) {
			throw new Error(providerError);
		}
		return mapResponse(data);
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
