import { createRequire } from 'node:module';
import { isIP } from 'node:net';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';

interface Ip2LocationRecord {
	readonly countryShort?: unknown;
	readonly countryLong?: unknown;
	readonly region?: unknown;
	readonly city?: unknown;
	readonly latitude?: unknown;
	readonly longitude?: unknown;
}

/** The documented asynchronous BIN-reader operations used by this adapter. */
export interface Ip2LocationBinReader {
	openAsync(databasePath: string): Promise<void>;
	getAllAsync(ip: string): Promise<Ip2LocationRecord>;
	closeAsync(): Promise<0 | -1>;
}

/** Creates a reader implementing the official IP2Location asynchronous BIN API. */
export type Ip2LocationBinReaderFactory = () => Ip2LocationBinReader;

/** Configuration for the local IP2Location BIN adapter. */
export interface Ip2LocationBinOptions {
	/** Path to a separately provisioned IP2Location BIN database. */
	readonly databasePath: string;
}

interface Ip2LocationModule {
	readonly IP2Location: new () => Ip2LocationBinReader;
}

const require = createRequire(import.meta.url);

function defaultReaderFactory(): Ip2LocationBinReader {
	const ip2location = require('ip2location-nodejs') as Ip2LocationModule;
	return new ip2location.IP2Location();
}

function optionalString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const normalized = value.trim();
	if (!normalized || ['-', '?', 'INVALID_IP_ADDRESS', 'MISSING_FILE', 'IPV6_NOT_SUPPORTED'].includes(normalized) || normalized.toLowerCase().startsWith('this method is not applicable for current ip2location binary data file')) {
		return undefined;
	}
	return normalized;
}

function optionalCoordinate(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapRecord(record: Ip2LocationRecord): GeolocationLookupResult | null {
	const countryCode = optionalString(record.countryShort);
	const countryName = optionalString(record.countryLong);
	const region = optionalString(record.region);
	const city = optionalString(record.city);
	const latitude = optionalCoordinate(record.latitude);
	const longitude = optionalCoordinate(record.longitude);
	if (!countryCode && !countryName && !region && !city && latitude === undefined && longitude === undefined) {
		return null;
	}
	return {
		provider: 'ip2location-bin',
		...(countryCode ? { countryCode } : {}),
		...(countryName ? { countryName } : {}),
		...(region ? { region } : {}),
		...(city ? { city } : {}),
		...(latitude !== undefined ? { latitude } : {}),
		...(longitude !== undefined ? { longitude } : {}),
	};
}

/**
 * Local IP2Location BIN adapter using the official `ip2location-nodejs` reader.
 *
 * @example
 * ```ts
 * const service = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' });
 * await service.startUp();
 * const location = await service.lookup('198.51.100.42');
 * await service.shutDown();
 * ```
 */
export class ServiceGeolocationIp2LocationBin implements ServiceBase<GeolocationService>, GeolocationService {
	public readonly provider = 'ip2location-bin';
	private readonly databasePath: string;
	private readonly readerFactory: Ip2LocationBinReaderFactory;
	private reader: Ip2LocationBinReader | undefined;

	/** Creates the adapter with a BIN path and optional reader factory. */
	constructor(options: Ip2LocationBinOptions, readerFactory: Ip2LocationBinReaderFactory = defaultReaderFactory) {
		if (!options.databasePath.trim()) {
			throw new Error('IP2Location BIN database path is required');
		}
		this.databasePath = options.databasePath;
		this.readerFactory = readerFactory;
	}

	/** Opens the configured BIN database and marks the adapter ready. */
	public async startUp(): Promise<GeolocationService> {
		if (this.reader) {
			throw new Error('IP2Location BIN geolocation service is already started');
		}
		const reader = this.readerFactory();
		await reader.openAsync(this.databasePath);
		this.reader = reader;
		return this;
	}

	/** Closes the BIN reader and marks the adapter unavailable. */
	public async shutDown(): Promise<void> {
		const { reader } = this;
		this.reader = undefined;
		if (reader && (await reader.closeAsync()) === -1) {
			throw new Error('IP2Location BIN reader failed to close');
		}
	}

	/** Looks up an IPv4 or IPv6 address in the configured BIN database. */
	public async lookup(ip: string): Promise<GeolocationLookupResult | null> {
		const ipVersion = isIP(ip);
		if (ipVersion === 0) {
			throw new Error('A valid IPv4 or IPv6 address is required');
		}
		const record = await this.requireReader().getAllAsync(ip);
		if (record.countryShort === 'MISSING_FILE') {
			throw new Error('IP2Location BIN database is unavailable');
		}
		if (record.countryShort === 'IPV6_NOT_SUPPORTED') {
			throw new Error(ipVersion === 6 ? 'IP2Location BIN database does not support IPv6' : 'IP2Location BIN lookup failed');
		}
		if (record.countryShort === 'INVALID_IP_ADDRESS') {
			return null;
		}
		return mapRecord(record);
	}

	private requireReader(): Ip2LocationBinReader {
		if (!this.reader) {
			throw new Error('IP2Location BIN geolocation service is not started');
		}
		return this.reader;
	}
}

export type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
