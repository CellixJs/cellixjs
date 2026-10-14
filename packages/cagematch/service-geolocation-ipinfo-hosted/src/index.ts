import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';

interface IpInfoResponse {
	readonly city?: string;
	readonly region?: string;
	readonly country?: string;
	readonly loc?: string;
}

export interface IpInfoHostedOptions {
	readonly token: string;
	readonly timeoutMs?: number;
}

function parseCoordinates(value: string | undefined): { latitude?: number; longitude?: number } {
	if (!value) {
		return {};
	}
	const [latitudeText, longitudeText] = value.split(',');
	const latitude = Number(latitudeText);
	const longitude = Number(longitudeText);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return {};
	}
	return { latitude, longitude };
}

function mapResponse(response: IpInfoResponse): GeolocationLookupResult {
	const coordinates = parseCoordinates(response.loc);
	return {
		provider: 'ipinfo-hosted',
		...(response.country ? { countryCode: response.country } : {}),
		...(response.region ? { region: response.region } : {}),
		...(response.city ? { city: response.city } : {}),
		...(coordinates.latitude !== undefined ? { latitude: coordinates.latitude } : {}),
		...(coordinates.longitude !== undefined ? { longitude: coordinates.longitude } : {}),
	};
}

/** IPinfo hosted geolocation API adapter using server-side bearer-token authentication. */
export class ServiceGeolocationIpInfoHosted implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'ipinfo-hosted';
	private readonly options: Required<IpInfoHostedOptions>;
	private readonly fetcher: typeof fetch;
	private started = false;

	constructor(options: IpInfoHostedOptions, fetcher: typeof fetch = fetch) {
		if (!options.token.trim()) {
			throw new Error('An IPinfo token is required');
		}
		this.options = { token: options.token, timeoutMs: options.timeoutMs ?? 3000 };
		this.fetcher = fetcher;
	}

	public startUp(): Promise<GeolocationService> {
		this.started = true;
		return Promise.resolve(this);
	}

	public shutDown(): Promise<void> {
		this.started = false;
		return Promise.resolve();
	}

	public async lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			throw new Error('A valid IPv4 or IPv6 address is required');
		}
		if (!this.started) {
			throw new Error('IPinfo geolocation service is not started');
		}
		const url = `https://ipinfo.io/${encodeURIComponent(ip)}/json`;
		const response = await this.fetcher(url, {
			headers: { authorization: `Bearer ${this.options.token}` },
			signal: AbortSignal.timeout(this.options.timeoutMs),
		});
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`IPinfo lookup failed with status ${response.status}`);
		}
		return mapResponse((await response.json()) as IpInfoResponse);
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
