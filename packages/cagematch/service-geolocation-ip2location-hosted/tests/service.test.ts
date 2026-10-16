import { ServiceGeolocationIp2LocationHosted } from '@ocom/service-geolocation-ip2location-hosted';
import { describe, expect, it, vi } from 'vitest';

describe('ServiceGeolocationIp2LocationHosted', () => {
	it('maps an IP2Location.io response and sends an optional key as bearer authentication', async () => {
		const fetcher = vi.fn<typeof fetch>(
			async () =>
				new Response(
					JSON.stringify({
						country_code: 'CA',
						country_name: 'Canada',
						region_name: 'Ontario',
						city_name: 'Toronto',
						latitude: 43.6532,
						longitude: -79.3832,
					}),
					{ status: 200 },
				),
		);
		const service = new ServiceGeolocationIp2LocationHosted({ apiKey: 'test-key' }, fetcher);
		await service.startUp();

		expect(await service.lookup('198.51.100.42')).toEqual({
			provider: 'ip2location-hosted',
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
		});
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.ip2location.io/?ip=198.51.100.42&format=json',
			expect.objectContaining({
				headers: { accept: 'application/json', authorization: 'Bearer test-key' },
			}),
		);
	});

	it('supports keyless IPv6 lookups and returns null when no location fields are available', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ ip: '2001:db8::1' }), { status: 200 }));
		const service = new ServiceGeolocationIp2LocationHosted({}, fetcher);
		await service.startUp();

		await expect(service.lookup('2001:db8::1')).resolves.toBeNull();
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.ip2location.io/?ip=2001%3Adb8%3A%3A1&format=json',
			expect.objectContaining({
				headers: { accept: 'application/json' },
			}),
		);
	});

	it('rejects invalid and unstarted lookups without making a request', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response('{}', { status: 200 }));
		const service = new ServiceGeolocationIp2LocationHosted({}, fetcher);

		await expect(service.lookup('not-an-ip')).rejects.toThrow('A valid IPv4 or IPv6 address is required');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('not started');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('rejects HTTP errors, provider error objects, and invalid response bodies', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response(null, { status: 503 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ error: { error_code: 10000, error_message: 'Invalid API key.' } }), { status: 200 }))
			.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
		const service = new ServiceGeolocationIp2LocationHosted({}, fetcher);
		await service.startUp();

		await expect(service.lookup('198.51.100.42')).rejects.toThrow('status 503');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('Invalid API key.');
		await expect(service.lookup('198.51.100.42')).rejects.toThrow('invalid response');
	});
});
