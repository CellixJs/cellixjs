import { ServiceGeolocationIpInfoLite } from '@ocom/service-geolocation-ipinfo-lite';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationIpInfoLite', () => {
	it('maps country-level Lite data and sends the token as a bearer credential', async () => {
		const fetcher = vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ ip: '8.8.8.8', country_code: 'US', country: 'United States', continent_code: 'NA', continent: 'North America' }), {
					status: 200,
				}),
		);
		const service = new ServiceGeolocationIpInfoLite({ token: 'test-token' }, fetcher);
		await service.startUp();

		await expect(service.lookup('8.8.8.8')).resolves.toEqual({
			provider: 'ipinfo-lite',
			countryCode: 'US',
			countryName: 'United States',
		});
		expect(fetcher).toHaveBeenCalledWith('https://api.ipinfo.io/lite/8.8.8.8', expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer test-token' }) }));
	});

	it('supports IPv6 addresses', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ country_code: 'US', country: 'United States' }), { status: 200 }));
		const service = new ServiceGeolocationIpInfoLite({ token: 'test-token' }, fetcher);
		await service.startUp();

		await expect(service.lookup('2001:4860:4860::8888')).resolves.toMatchObject({ countryCode: 'US' });
		expect(fetcher).toHaveBeenCalledWith('https://api.ipinfo.io/lite/2001%3A4860%3A4860%3A%3A8888', expect.anything());
	});

	it('requires a token and a started service', async () => {
		expect(() => new ServiceGeolocationIpInfoLite({ token: '  ' })).toThrow('IPinfo Lite token is required');
		const service = new ServiceGeolocationIpInfoLite({ token: 'test-token' }, vi.fn<typeof fetch>());
		await expect(service.lookup('8.8.8.8')).rejects.toThrow('not started');
		await service.startUp();
		await service.shutDown();
		await expect(service.lookup('8.8.8.8')).rejects.toThrow('not started');
	});

	it('returns null when the response has no country or the address is not found', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response(JSON.stringify({ ip: '192.0.2.1', bogon: true }), { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 404 }));
		const service = new ServiceGeolocationIpInfoLite({ token: 'test-token' }, fetcher);
		await service.startUp();

		await expect(service.lookup('192.0.2.1')).resolves.toBeNull();
		await expect(service.lookup('198.51.100.42')).resolves.toBeNull();
	});

	it('rejects invalid addresses and provider failures', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 429 }));
		const service = new ServiceGeolocationIpInfoLite({ token: 'test-token' }, fetcher);
		await service.startUp();

		await expect(service.lookup('not-an-ip')).rejects.toThrow('valid IPv4 or IPv6');
		expect(fetcher).not.toHaveBeenCalled();
		await expect(service.lookup('8.8.8.8')).rejects.toThrow('status 429');
	});
});
