import { describe, expect, it } from 'vitest';
import { createGeolocationConfiguration } from './index.ts';

describe('createGeolocationConfiguration', () => {
	it.each([
		['dbip-hosted', { GEOLOCATION_DBIP_API_KEY: 'dbip-key' }],
		['dbip-mmdb', { GEOLOCATION_DBIP_DATABASE_PATH: '/data/dbip.mmdb' }],
		['ip2location-bin', { GEOLOCATION_IP2LOCATION_DATABASE_PATH: '/data/ip2location.bin' }],
		['ip2location-hosted', {}],
		['ipinfo-hosted', { GEOLOCATION_IPINFO_TOKEN: 'ipinfo-token' }],
		['ipinfo-lite', { GEOLOCATION_IPINFO_LITE_TOKEN: 'ipinfo-lite-token' }],
		['ipinfo-mmdb', { GEOLOCATION_IPINFO_DATABASE_PATH: '/data/ipinfo.mmdb' }],
		['maxmind-hosted', { GEOLOCATION_MAXMIND_ACCOUNT_ID: 'account', GEOLOCATION_MAXMIND_LICENSE_KEY: 'license' }],
		['maxmind-mmdb', { GEOLOCATION_MAXMIND_DATABASE_PATH: '/data/maxmind.mmdb' }],
	] as const)('selects %s with an explicitly trusted ingress header', (provider, providerEnvironment) => {
		const configuration = createGeolocationConfiguration({
			GEOLOCATION_PROVIDER: provider,
			GEOLOCATION_TRUSTED_IP_HEADER: 'x-azure-clientip',
			...providerEnvironment,
		});

		expect(configuration.geolocationService?.provider).toBe(provider);
		expect(configuration.geolocationTrustedIpHeader).toBe('azureClientIp');
	});

	it('leaves geolocation disabled when no provider is selected', () => {
		expect(createGeolocationConfiguration({})).toEqual({ geolocationService: undefined, geolocationTrustedIpHeader: undefined });
	});

	it('selects one configured provider and a trusted ingress header', () => {
		const configuration = createGeolocationConfiguration({
			GEOLOCATION_PROVIDER: 'maxmind-mmdb',
			GEOLOCATION_MAXMIND_DATABASE_PATH: '/var/lib/geoip/city.mmdb',
			GEOLOCATION_TRUSTED_IP_HEADER: 'x-azure-clientip',
		});

		expect(configuration.geolocationService?.provider).toBe('maxmind-mmdb');
		expect(configuration.geolocationTrustedIpHeader).toBe('azureClientIp');
	});

	it('requires explicit ingress trust when a provider is selected', () => {
		expect(() =>
			createGeolocationConfiguration({
				GEOLOCATION_PROVIDER: 'maxmind-mmdb',
				GEOLOCATION_MAXMIND_DATABASE_PATH: '/var/lib/geoip/city.mmdb',
			}),
		).toThrow('GEOLOCATION_TRUSTED_IP_HEADER');
	});
});
