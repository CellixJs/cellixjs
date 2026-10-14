import { ServiceGeolocationDbIpHosted } from '@ocom/service-geolocation-dbip-hosted';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationDbIpHosted', () => {
	it('maps a hosted response and calls the HTTPS endpoint with the configured API key', async () => {
		const fetcher = vi.fn<typeof fetch>(
			async () =>
				new Response(
					JSON.stringify({
						countryCode: 'CA',
						countryName: 'Canada',
						stateProv: 'Ontario',
						city: 'Toronto',
						latitude: 43.6532,
						longitude: -79.3832,
					}),
					{ status: 200 },
				),
		);
		const service = new ServiceGeolocationDbIpHosted({ apiKey: 'test-key' }, fetcher);
		await service.startUp();

		expect(await service.lookup('198.51.100.42')).toEqual({
			provider: 'dbip-hosted',
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
		});
		expect(fetcher).toHaveBeenCalledWith('https://api.db-ip.com/v2/test-key/198.51.100.42', expect.any(Object));
	});

	it('rejects invalid or unstarted lookups without calling the provider', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response('{}', { status: 200 }));
		const service = new ServiceGeolocationDbIpHosted({ apiKey: 'test-key' }, fetcher);
		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		await service.startUp();
		await expect(service.lookup('2001:db8::1')).resolves.toEqual({ provider: 'dbip-hosted' });
		expect(fetcher).toHaveBeenCalledWith('https://api.db-ip.com/v2/test-key/2001%3Adb8%3A%3A1', expect.any(Object));
		await service.shutDown();
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('not started');
	});

	it('returns null for 404 and rejects HTTP and DB-IP API errors', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response(null, { status: 404 }))
			.mockResolvedValueOnce(new Response(null, { status: 503 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ errorCode: 'INVALID_KEY', error: 'invalid API key' }), { status: 200 }));
		const service = new ServiceGeolocationDbIpHosted({ apiKey: 'test-key' }, fetcher);
		await service.startUp();

		await expect(service.lookup('198.51.100.42')).resolves.toBeNull();
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('status 503');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('INVALID_KEY');
	});

	it('requires a non-empty API key', () => {
		expect(() => new ServiceGeolocationDbIpHosted({ apiKey: '  ' })).toThrow('DB-IP API key is required');
	});
});
