import { describe, expect, it } from 'vitest';
import { createGeolocationService } from './index.ts';

describe('createGeolocationService', () => {
	it('creates the IPinfo Lite service when a token is configured', () => {
		expect(createGeolocationService({ GEOLOCATION_IPINFO_LITE_TOKEN: ' token ' })?.provider).toBe('ipinfo-lite');
	});

	it('leaves geolocation disabled without a token', () => {
		expect(createGeolocationService({})).toBeUndefined();
		expect(createGeolocationService({ GEOLOCATION_IPINFO_LITE_TOKEN: '  ' })).toBeUndefined();
	});
});
