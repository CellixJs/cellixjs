import { ServiceGeolocationMaxMindMmdb } from '@ocom/service-geolocation-maxmind-mmdb';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationMaxMindMmdb', () => {
	it('normalizes a local city record and returns null for unknown database addresses', async () => {
		const city = vi.fn().mockReturnValue({
			country: { isoCode: 'CA', names: { en: 'Canada' } },
			subdivisions: [{ names: { en: 'Ontario' } }],
			city: { names: { en: 'Toronto' } },
			location: { latitude: 43.65, longitude: -79.38, accuracyRadius: 20 },
		});
		const service = new ServiceGeolocationMaxMindMmdb({ databasePath: 'test.mmdb' }, async () => ({ city }) as never);
		await service.startUp();

		expect(await service.lookup('198.51.100.42')).toEqual({
			provider: 'maxmind-mmdb',
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.65,
			longitude: -79.38,
			accuracyRadiusKm: 20,
		});

		city.mockImplementation(() => {
			const error = new Error('Not found');
			error.name = 'AddressNotFoundError';
			throw error;
		});
		expect(await service.lookup('192.0.2.1')).toBeNull();
	});

	it('rejects invalid addresses and requires startup before a valid lookup', async () => {
		const service = new ServiceGeolocationMaxMindMmdb({ databasePath: 'test.mmdb' }, async () => ({ city: vi.fn() }) as never);
		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('not started');
	});
});
