import { ServiceGeolocationIpInfoHosted } from '@ocom/service-geolocation-ipinfo-hosted';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationIpInfoHosted', () => {
	it('normalizes the hosted response and sends the token in a bearer header', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ city: 'Toronto', region: 'Ontario', country: 'CA', loc: '43.65,-79.38' }), { status: 200 }));
		const service = new ServiceGeolocationIpInfoHosted({ token: 'test-token' }, fetcher);
		await service.startUp();

		expect(await service.lookup('198.51.100.42')).toEqual({
			provider: 'ipinfo-hosted',
			countryCode: 'CA',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.65,
			longitude: -79.38,
		});
		expect(fetcher).toHaveBeenCalledWith(
			'https://ipinfo.io/198.51.100.42/json',
			expect.objectContaining({
				headers: { authorization: 'Bearer test-token' },
			}),
		);
	});

	it('returns null for an unknown address and rejects non-success responses', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response(null, { status: 404 }))
			.mockResolvedValueOnce(new Response(null, { status: 429 }));
		const service = new ServiceGeolocationIpInfoHosted({ token: 'test-token' }, fetcher);
		await service.startUp();

		await expect(service.lookup('192.0.2.1')).resolves.toBeNull();
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('status 429');
	});
});
