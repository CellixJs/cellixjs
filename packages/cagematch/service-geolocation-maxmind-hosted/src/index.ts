import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
import { WebServiceClient } from '@maxmind/geoip2-node';

type CityResponse = Awaited<ReturnType<WebServiceClient['city']>>;
type CityLookupClient = Pick<WebServiceClient, 'city'>;
type ClientFactory = (accountId: string, licenseKey: string, options: { host: string; timeout: number }) => CityLookupClient;

export interface MaxMindHostedOptions {
	readonly accountId: string;
	readonly licenseKey: string;
	readonly host?: string;
	readonly timeoutMs?: number;
}

function mapCity(record: CityResponse): GeolocationLookupResult {
	const { country, city, subdivisions, location } = record;
	return {
		provider: 'maxmind-hosted',
		...(country?.isoCode ? { countryCode: country.isoCode } : {}),
		...(country?.names.en ? { countryName: country.names.en } : {}),
		...(subdivisions?.[0]?.names.en ? { region: subdivisions[0].names.en } : {}),
		...(city?.names.en ? { city: city.names.en } : {}),
		...(location?.latitude !== undefined ? { latitude: location.latitude } : {}),
		...(location?.longitude !== undefined ? { longitude: location.longitude } : {}),
		...(location?.accuracyRadius !== undefined ? { accuracyRadiusKm: location.accuracyRadius } : {}),
	};
}

/** MaxMind hosted GeoIP2/GeoLite City web-service adapter. */
export class ServiceGeolocationMaxMindHosted implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'maxmind-hosted';
	private readonly options: Required<MaxMindHostedOptions>;
	private readonly createClient: ClientFactory;
	private client: CityLookupClient | undefined;

	constructor(options: MaxMindHostedOptions, createClient: ClientFactory = (accountId, licenseKey, clientOptions) => new WebServiceClient(accountId, licenseKey, clientOptions)) {
		if (!options.accountId.trim() || !options.licenseKey.trim()) {
			throw new Error('MaxMind account ID and license key are required');
		}
		this.options = {
			accountId: options.accountId,
			licenseKey: options.licenseKey,
			host: options.host ?? 'geoip.maxmind.com',
			timeoutMs: options.timeoutMs ?? 3000,
		};
		this.createClient = createClient;
	}

	public startUp(): Promise<GeolocationService> {
		if (this.client) {
			throw new Error('MaxMind hosted geolocation service is already started');
		}
		this.client = this.createClient(this.options.accountId, this.options.licenseKey, {
			host: this.options.host,
			timeout: this.options.timeoutMs,
		});
		return Promise.resolve(this);
	}

	public shutDown(): Promise<void> {
		this.client = undefined;
		return Promise.resolve();
	}

	public async lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			throw new Error('A valid IPv4 or IPv6 address is required');
		}
		try {
			return mapCity(await this.requireClient().city(ip));
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AddressNotFoundError') {
				return null;
			}
			throw error;
		}
	}

	private requireClient(): CityLookupClient {
		if (!this.client) {
			throw new Error('MaxMind hosted geolocation service is not started');
		}
		return this.client;
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
