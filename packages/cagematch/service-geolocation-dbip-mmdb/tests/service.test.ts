import type { ReaderModel } from '@maxmind/geoip2-node';
import { ServiceGeolocationDbIpMmdb } from '@ocom/service-geolocation-dbip-mmdb';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationDbIpMmdb', () => {
	it('maps a City Lite MaxMind-compatible record with the distinct DB-IP provider id', async () => {
		const record = {
			country: { isoCode: 'CA', names: { en: 'Canada' } },
			subdivisions: [{ names: { en: 'Ontario' } }],
			city: { names: { en: 'Toronto' } },
			location: { latitude: 43.6532, longitude: -79.3832, accuracyRadius: 20 },
		};
		const city = vi.fn<ReaderModel['city']>(() => record as unknown as ReturnType<ReaderModel['city']>);
		const openReader = vi.fn(async () => ({ city }) as unknown as Pick<ReaderModel, 'city'>);
		const service = new ServiceGeolocationDbIpMmdb({ databasePath: 'dbip-city-lite.mmdb' }, openReader);
		await service.startUp();

		expect(openReader).toHaveBeenCalledWith('dbip-city-lite.mmdb');
		expect(await service.lookup('198.51.100.42')).toEqual({
			provider: 'dbip-mmdb',
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
			accuracyRadiusKm: 20,
		});
		expect(city).toHaveBeenCalledWith('198.51.100.42');
	});

	it('returns null for addresses absent from the database', async () => {
		const city = vi.fn<ReaderModel['city']>(() => {
			const error = new Error('Address not found');
			error.name = 'AddressNotFoundError';
			throw error;
		});
		const service = new ServiceGeolocationDbIpMmdb({ databasePath: 'dbip-city-lite.mmdb' }, async () => ({ city }) as unknown as Pick<ReaderModel, 'city'>);
		await service.startUp();

		await expect(service.lookup('192.0.2.1')).resolves.toBeNull();
	});

	it('rejects invalid or unstarted lookups and propagates reader failures', async () => {
		const city = vi.fn<ReaderModel['city']>(() => {
			throw new Error('corrupt database');
		});
		const service = new ServiceGeolocationDbIpMmdb({ databasePath: 'dbip-city-lite.mmdb' }, async () => ({ city }) as unknown as Pick<ReaderModel, 'city'>);

		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('not started');
		await service.startUp();
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('corrupt database');
	});

	it('requires a database path and prevents duplicate startup', async () => {
		expect(() => new ServiceGeolocationDbIpMmdb({ databasePath: '  ' })).toThrow('DB-IP City Lite database path is required');
		const service = new ServiceGeolocationDbIpMmdb({ databasePath: 'dbip-city-lite.mmdb' }, async () => ({ city: vi.fn<ReaderModel['city']>() }) as unknown as Pick<ReaderModel, 'city'>);
		await service.startUp();
		await expect(service.startUp()).rejects.toThrow('already started');
	});
});
