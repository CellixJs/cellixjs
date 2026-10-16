import { describe, expect, it, vi } from 'vitest';
import { createGeolocationApplicationService } from './capture-request.ts';

describe('Geolocation application service', () => {
	it('looks up only the configured trusted header and stores the normalized observation', async () => {
		const lookup = vi.fn().mockResolvedValue({ provider: 'test-provider', countryCode: 'CA' });
		const record = vi.fn().mockResolvedValue(undefined);
		const service = { provider: 'test-provider', lookup };
		const geolocation = createGeolocationApplicationService(service, { record }, 'azureClientIp');

		const result = await geolocation.captureRequest({
			forwardedFor: '203.0.113.10',
			azureClientIp: '198.51.100.20',
			azureSocketIp: undefined,
			realIp: undefined,
		});

		expect(lookup).toHaveBeenCalledWith('198.51.100.20');
		expect(record).toHaveBeenCalledWith({
			provider: 'test-provider',
			result: { provider: 'test-provider', countryCode: 'CA' },
			lookedUpAt: expect.any(Date),
		});
		expect(result).toEqual({ provider: 'test-provider', countryCode: 'CA' });
	});

	it('does not trust a header unless it is explicitly configured and contains one valid IP address', async () => {
		const lookup = vi.fn();
		const record = vi.fn();
		const service = { provider: 'test-provider', lookup };
		const geolocation = createGeolocationApplicationService(service, { record }, undefined);

		await geolocation.captureRequest({
			forwardedFor: '203.0.113.10',
			azureClientIp: undefined,
			azureSocketIp: undefined,
			realIp: undefined,
		});

		expect(lookup).not.toHaveBeenCalled();
		expect(record).not.toHaveBeenCalled();
	});

	it('ignores invalid or multi-address values from the configured header', async () => {
		const lookup = vi.fn();
		const record = vi.fn();
		const service = { provider: 'test-provider', lookup };
		const geolocation = createGeolocationApplicationService(service, { record }, 'forwardedFor');

		await geolocation.captureRequest({
			forwardedFor: '198.51.100.20, 203.0.113.10',
			azureClientIp: undefined,
			azureSocketIp: undefined,
			realIp: undefined,
		});

		expect(lookup).not.toHaveBeenCalled();
		expect(record).not.toHaveBeenCalled();
	});
});
