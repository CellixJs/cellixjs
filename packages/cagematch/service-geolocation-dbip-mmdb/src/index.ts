import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
import { Reader, type ReaderModel } from '@maxmind/geoip2-node';

type CityReader = Pick<ReaderModel, 'city'>;
type CityReaderFactory = (databasePath: string) => Promise<CityReader>;

/** Configuration for a local DB-IP City Lite database. */
export interface DbIpMmdbOptions {
	/** Path to the provisioned MaxMind-compatible DB-IP City Lite MMDB file. */
	readonly databasePath: string;
}

function mapCity(record: ReturnType<ReaderModel['city']>): GeolocationLookupResult {
	const { country, city, subdivisions, location } = record;
	return {
		provider: 'dbip-mmdb',
		...(country?.isoCode ? { countryCode: country.isoCode } : {}),
		...(country?.names.en ? { countryName: country.names.en } : {}),
		...(subdivisions?.[0]?.names.en ? { region: subdivisions[0].names.en } : {}),
		...(city?.names.en ? { city: city.names.en } : {}),
		...(location?.latitude !== undefined ? { latitude: location.latitude } : {}),
		...(location?.longitude !== undefined ? { longitude: location.longitude } : {}),
		...(location?.accuracyRadius !== undefined ? { accuracyRadiusKm: location.accuracyRadius } : {}),
	};
}

/**
 * Local DB-IP City Lite adapter backed by the typed MaxMind GeoIP2 City reader.
 *
 * @example
 * ```ts
 * const service = new ServiceGeolocationDbIpMmdb({ databasePath: '/data/dbip-city-lite.mmdb' });
 * await service.startUp();
 * const location = await service.lookup('198.51.100.42');
 * ```
 */
export class ServiceGeolocationDbIpMmdb implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'dbip-mmdb';
	private readonly databasePath: string;
	private readonly openReader: CityReaderFactory;
	private reader: CityReader | undefined;

	/**
	 * Creates the local adapter.
	 *
	 * @param options - Path to the DB-IP City Lite MMDB file.
	 * @param openReader - Optional reader factory, primarily for deterministic tests.
	 * @throws When the database path is empty.
	 */
	constructor(options: DbIpMmdbOptions, openReader: CityReaderFactory = (path) => Reader.open(path)) {
		if (!options.databasePath.trim()) {
			throw new Error('DB-IP City Lite database path is required');
		}
		this.databasePath = options.databasePath;
		this.openReader = openReader;
	}

	/** Opens the database reader and marks the adapter ready. */
	public async startUp(): Promise<GeolocationService> {
		if (this.reader) {
			throw new Error('DB-IP MMDB geolocation service is already started');
		}
		this.reader = await this.openReader(this.databasePath);
		return this;
	}

	/** Releases the database reader. */
	public shutDown(): Promise<void> {
		this.reader = undefined;
		return Promise.resolve();
	}

	/**
	 * Looks up an IPv4 or IPv6 address in the local City Lite database.
	 *
	 * @param ip - Address to look up.
	 * @returns The normalized location, or `null` when the database has no matching record.
	 * @throws For invalid addresses, calls made before startup, or reader failures.
	 */
	public lookup(ip: string): Promise<GeolocationLookupResult | null> {
		if (isIP(ip) === 0) {
			return Promise.reject(new Error('A valid IPv4 or IPv6 address is required'));
		}
		if (!this.reader) {
			return Promise.reject(new Error('DB-IP MMDB geolocation service is not started'));
		}
		try {
			return Promise.resolve(mapCity(this.reader.city(ip)));
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AddressNotFoundError') {
				return Promise.resolve(null);
			}
			return Promise.reject(error);
		}
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
