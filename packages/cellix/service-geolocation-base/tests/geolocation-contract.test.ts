import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
import { describe, expect, it } from 'vitest';

const exerciseLookup = async (service: Pick<GeolocationService, 'lookup'>, ip: string) => service.lookup(ip);

describe('GeolocationService public contract', () => {
	it('returns normalized location fields independent of the provider', async () => {
		const result: GeolocationLookupResult = {
			countryCode: 'CA',
			countryName: 'Canada',
			region: 'Ontario',
			city: 'Toronto',
			latitude: 43.6532,
			longitude: -79.3832,
			accuracyRadiusKm: 20,
			provider: 'contract-test',
		};
		const service: Pick<GeolocationService, 'lookup'> = {
			lookup(ip) {
				expect(ip).toBe('198.51.100.42');
				return Promise.resolve(result);
			},
		};

		expect(await exerciseLookup(service, '198.51.100.42')).toEqual(result);
	});

	it('represents an unlocated address as null', async () => {
		const service: Pick<GeolocationService, 'lookup'> = {
			lookup() {
				return Promise.resolve(null);
			},
		};

		expect(await exerciseLookup(service, '192.0.2.1')).toBeNull();
	});
});
