import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
import { Reader, type ReaderModel } from '@maxmind/geoip2-node';

type CityReader = Pick<ReaderModel, 'city'>;
type CityReaderFactory = (databasePath: string) => Promise<CityReader>;

export interface MaxMindMmdbOptions {
	readonly databasePath: string;
}

function mapCity(record: ReturnType<ReaderModel['city']>): GeolocationLookupResult {
	const { country, city, subdivisions, location } = record;
	return {
		provider: 'maxmind-mmdb',
		...(country?.isoCode ? { countryCode: country.isoCode } : {}),
		...(country?.names.en ? { countryName: country.names.en } : {}),
		...(subdivisions?.[0]?.names.en ? { region: subdivisions[0].names.en } : {}),
		...(city?.names.en ? { city: city.names.en } : {}),
		...(location?.latitude !== undefined ? { latitude: location.latitude } : {}),
		...(location?.longitude !== undefined ? { longitude: location.longitude } : {}),
		...(location?.accuracyRadius !== undefined ? { accuracyRadiusKm: location.accuracyRadius } : {}),
	};
}

/** Local MaxMind City MMDB adapter. The licensed database is supplied by deployment configuration. */
export class ServiceGeolocationMaxMindMmdb implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'maxmind-mmdb';
	private readonly databasePath: string;
	private readonly openReader: CityReaderFactory;
	private reader: CityReader | undefined;

	constructor(options: MaxMindMmdbOptions, openReader: CityReaderFactory = (path) => Reader.open(path)) {
		if (!options.databasePath.trim()) {
			throw new Error('A MaxMind MMDB database path is required');
		}
		this.databasePath = options.databasePath;
		this.openReader = openReader;
	}

	public async startUp(): Promise<GeolocationService> {
		if (this.reader) {
			throw new Error('MaxMind MMDB geolocation service is already started');
		}
		this.reader = await this.openReader(this.databasePath);
		return this;
	}

	public shutDown(): Promise<void> {
		this.reader = undefined;
		return Promise.resolve();
	}

	public lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			return Promise.reject(new Error('A valid IPv4 or IPv6 address is required'));
		}
		try {
			const reader = this.requireReader();
			return Promise.resolve(mapCity(reader.city(ip)));
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AddressNotFoundError') {
				return Promise.resolve(null);
			}
			return Promise.reject(error);
		}
	}

	private requireReader(): CityReader {
		if (!this.reader) {
			throw new Error('MaxMind MMDB geolocation service is not started');
		}
		return this.reader;
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
