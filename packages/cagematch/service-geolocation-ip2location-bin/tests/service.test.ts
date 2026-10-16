import { ServiceGeolocationIp2LocationBin } from '@ocom/service-geolocation-ip2location-bin';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationIp2LocationBin', () => {
	it('opens the configured database, maps the official reader result, and closes it on shutdown', async () => {
		const openAsync = vi.fn(async () => undefined);
		const getAllAsync = vi.fn(async () => ({
			countryShort: 'CA',
			countryLong: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
		}));
		const closeAsync = vi.fn(async () => 0 as const);
		const readerFactory = vi.fn(() => ({ openAsync, getAllAsync, closeAsync }));
		const service = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' }, readerFactory);
		await service.startUp();

		expect(openAsync).toHaveBeenCalledWith('/data/IP2LOCATION.BIN');
		expect(await service.lookup('198.51.100.42')).toEqual({
			provider: 'ip2location-bin',
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
		});
		expect(getAllAsync).toHaveBeenCalledWith('198.51.100.42');

		await service.shutDown();
		expect(closeAsync).toHaveBeenCalledOnce();
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('not started');
	});

	it('returns null for no-result records and rejects database IPv6 limitations', async () => {
		const emptyRecord = { countryShort: '-', countryLong: '?', region: '?', city: '?', latitude: '?', longitude: '?' };
		const getAllAsync = vi
			.fn(async () => ({ ...emptyRecord, countryShort: 'INVALID_IP_ADDRESS' }))
			.mockResolvedValueOnce({ ...emptyRecord, countryShort: 'INVALID_IP_ADDRESS' })
			.mockResolvedValueOnce(emptyRecord)
			.mockResolvedValueOnce({ ...emptyRecord, countryShort: 'IPV6_NOT_SUPPORTED' });
		const service = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' }, () => ({ openAsync: async () => undefined, getAllAsync, closeAsync: async () => 0 }));
		await service.startUp();

		await expect(service.lookup('198.51.100.42')).resolves.toBeNull();
		await expect(service.lookup('198.51.100.42')).resolves.toBeNull();
		await expect(service.lookup('2001:db8::1')).rejects.toThrow('does not support IPv6');
	});

	it('rejects invalid input before calling the reader and propagates reader failures', async () => {
		const getAllAsync = vi.fn(() => Promise.reject(new Error('database read failed')));
		const service = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' }, () => ({ openAsync: async () => undefined, getAllAsync, closeAsync: async () => 0 }));

		await expect(service.lookup('198.51.100.42')).rejects.toThrow('not started');
		await service.startUp();
		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('database read failed');
		expect(getAllAsync).toHaveBeenCalledOnce();
	});

	it('rejects an empty database path and surfaces reader open/close errors', async () => {
		expect(() => new ServiceGeolocationIp2LocationBin({ databasePath: '  ' })).toThrow('database path is required');
		const openFailure = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' }, () => ({
			openAsync: () => Promise.reject(new Error('database open failed')),
			getAllAsync: async () => ({}),
			closeAsync: async () => -1,
		}));
		await expect(openFailure.startUp()).rejects.toThrow('database open failed');

		const closeFailure = new ServiceGeolocationIp2LocationBin({ databasePath: '/data/IP2LOCATION.BIN' }, () => ({ openAsync: async () => undefined, getAllAsync: async () => ({}), closeAsync: async () => -1 }));
		await closeFailure.startUp();
		await expect(closeFailure.shutDown()).rejects.toThrow('failed to close');
	});
});
