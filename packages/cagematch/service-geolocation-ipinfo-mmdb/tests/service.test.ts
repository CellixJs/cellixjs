import { ServiceGeolocationIpInfoMmdb } from '@ocom/service-geolocation-ipinfo-mmdb';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationIpInfoMmdb', () => {
	it('maps an IPinfo Core record from a local MMDB reader', async () => {
		const get = vi.fn().mockReturnValue({
			country: 'Canada',
			country_code: 'CA',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
		});
		const openReader = vi.fn(async () => ({ get }));
		const service = new ServiceGeolocationIpInfoMmdb({ databasePath: 'ipinfo-core.mmdb' }, openReader);
		await service.startUp();

		expect(openReader).toHaveBeenCalledWith('ipinfo-core.mmdb');
		expect(await service.lookup('203.0.113.42')).toEqual({
			provider: 'ipinfo-mmdb',
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
		});
		expect(get).toHaveBeenCalledWith('203.0.113.42');
	});

	it('returns null when the MMDB has no record and rejects invalid or unstarted lookups', async () => {
		const service = new ServiceGeolocationIpInfoMmdb({ databasePath: 'ipinfo-core.mmdb' }, async () => ({ get: () => null }));
		await expect(service.lookup('203.0.113.42')).rejects.toThrow('not started');
		await service.startUp();
		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		expect(await service.lookup('203.0.113.42')).toBeNull();
	});
});
