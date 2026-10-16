import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
import { open } from 'maxmind';

interface IpInfoReader {
	get(ip: string): unknown | null;
}

export interface IpInfoMmdbOptions {
	readonly databasePath: string;
}

type ReaderFactory = (databasePath: string) => Promise<IpInfoReader>;

function mapRecord(record: unknown): GeolocationLookupResult {
	if (record === null || typeof record !== 'object') {
		return { provider: 'ipinfo-mmdb' };
	}
	const fields = record as Record<string, unknown>;
	const country = fields['country'];
	const countryCode = fields['country_code'];
	const region = fields['region'];
	const city = fields['city'];
	const latitude = fields['latitude'];
	const longitude = fields['longitude'];
	return {
		provider: 'ipinfo-mmdb',
		...(typeof countryCode === 'string' ? { countryCode } : {}),
		...(typeof country === 'string' ? { countryName: country } : {}),
		...(typeof region === 'string' ? { region } : {}),
		...(typeof city === 'string' ? { city } : {}),
		...(typeof latitude === 'number' ? { latitude } : {}),
		...(typeof longitude === 'number' ? { longitude } : {}),
	};
}

/** IPinfo Core MMDB adapter using a local database file and the generic MaxMind reader. */
export class ServiceGeolocationIpInfoMmdb implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'ipinfo-mmdb';
	private readonly databasePath: string;
	private readonly openReader: ReaderFactory;
	private reader: IpInfoReader | undefined;

	constructor(options: IpInfoMmdbOptions, openReader: ReaderFactory = (path) => open(path)) {
		if (!options.databasePath.trim()) {
			throw new Error('An IPinfo Core MMDB database path is required');
		}
		this.databasePath = options.databasePath;
		this.openReader = openReader;
	}

	public async startUp(): Promise<GeolocationService> {
		if (this.reader) {
			throw new Error('IPinfo MMDB geolocation service is already started');
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
		if (!this.reader) {
			return Promise.reject(new Error('IPinfo MMDB geolocation service is not started'));
		}
		const record = this.reader.get(ip);
		return Promise.resolve(record ? mapRecord(record) : null);
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
