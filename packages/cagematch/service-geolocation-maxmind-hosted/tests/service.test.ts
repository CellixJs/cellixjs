import { ServiceGeolocationMaxMindHosted } from '@ocom/service-geolocation-maxmind-hosted';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationMaxMindHosted', () => {
	it('normalizes a mocked hosted response and applies configured endpoint options', async () => {
		const city = vi.fn().mockResolvedValue({
			country: { isoCode: 'CA', names: { en: 'Canada' } },
			subdivisions: [{ names: { en: 'Ontario' } }],
			city: { names: { en: 'Toronto' } },
			location: { latitude: 43.65, longitude: -79.38, accuracyRadius: 20 },
		});
		const createClient = vi.fn(() => ({ city }) as never);
		const service = new ServiceGeolocationMaxMindHosted({ accountId: 'test-account', licenseKey: 'not-a-real-key', host: 'sandbox.maxmind.com', timeoutMs: 500 }, createClient);
		await service.startUp();

		expect(createClient).toHaveBeenCalledWith('test-account', 'not-a-real-key', {
			host: 'sandbox.maxmind.com',
			timeout: 500,
		});
		expect(await service.lookup('198.51.100.42')).toMatchObject({ provider: 'maxmind-hosted', countryCode: 'CA', city: 'Toronto' });
	});

	it('rejects invalid addresses before calling the hosted provider', async () => {
		const city = vi.fn();
		const service = new ServiceGeolocationMaxMindHosted({ accountId: 'test-account', licenseKey: 'not-a-real-key' }, () => ({ city }) as never);
		await service.startUp();

		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		expect(city).not.toHaveBeenCalled();
	});
});
