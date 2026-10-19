import { ServiceGeolocationIpInfoLite } from '@ocom/service-geolocation-ipinfo-lite';

/**
 * Creates the IPinfo Lite geolocation service when `GEOLOCATION_IPINFO_LITE_TOKEN` is set.
 * Locally the token comes from `packages/ocom/service-geolocation-ipinfo-lite/.env`, merged into the Functions local settings.
 */
export const createGeolocationService = (environment: Readonly<Record<string, string | undefined>> = process.env): ServiceGeolocationIpInfoLite | undefined => {
	const token = environment['GEOLOCATION_IPINFO_LITE_TOKEN']?.trim();
	return token ? new ServiceGeolocationIpInfoLite({ token }) : undefined;
};
