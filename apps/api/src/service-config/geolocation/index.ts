import type { ServiceBase } from '@cellix/api-services-spec';
import type { GeolocationService } from '@cellix/service-geolocation-base';
import type { GeolocationTrustedIpHeader } from '@ocom/context-spec';
import { ServiceGeolocationDbIpHosted } from '@ocom/service-geolocation-dbip-hosted';
import { ServiceGeolocationDbIpMmdb } from '@ocom/service-geolocation-dbip-mmdb';
import { ServiceGeolocationIp2LocationBin } from '@ocom/service-geolocation-ip2location-bin';
import { ServiceGeolocationIp2LocationHosted } from '@ocom/service-geolocation-ip2location-hosted';
import { ServiceGeolocationIpInfoHosted } from '@ocom/service-geolocation-ipinfo-hosted';
import { ServiceGeolocationIpInfoMmdb } from '@ocom/service-geolocation-ipinfo-mmdb';
import { ServiceGeolocationMaxMindHosted } from '@ocom/service-geolocation-maxmind-hosted';
import { ServiceGeolocationMaxMindMmdb } from '@ocom/service-geolocation-maxmind-mmdb';

export interface GeolocationConfiguration {
	readonly geolocationService: (GeolocationService & ServiceBase<GeolocationService>) | undefined;
	readonly geolocationTrustedIpHeader: GeolocationTrustedIpHeader | undefined;
}

const trustedHeaderByName: Readonly<Record<string, GeolocationTrustedIpHeader>> = {
	'x-forwarded-for': 'forwardedFor',
	'x-azure-clientip': 'azureClientIp',
	'x-azure-socketip': 'azureSocketIp',
	'x-real-ip': 'realIp',
};

/** Creates the selected adapter only when GEOLOCATION_PROVIDER is configured. */
export const createGeolocationConfiguration = (environment: Readonly<Record<string, string | undefined>> = process.env): GeolocationConfiguration => {
	const providerName = environment['GEOLOCATION_PROVIDER']?.trim().toLowerCase();
	if (!providerName) {
		return { geolocationService: undefined, geolocationTrustedIpHeader: undefined };
	}

	const trustedHeaderName = environment['GEOLOCATION_TRUSTED_IP_HEADER']?.trim().toLowerCase();
	const geolocationTrustedIpHeader = trustedHeaderName ? trustedHeaderByName[trustedHeaderName] : undefined;
	if (!geolocationTrustedIpHeader) {
		throw new Error('GEOLOCATION_TRUSTED_IP_HEADER must name a trusted ingress header when geolocation is enabled');
	}

	let geolocationService: GeolocationService & ServiceBase<GeolocationService>;
	switch (providerName) {
		case 'dbip-hosted':
			geolocationService = new ServiceGeolocationDbIpHosted({ apiKey: environment['GEOLOCATION_DBIP_API_KEY'] ?? '' });
			break;
		case 'dbip-mmdb':
			geolocationService = new ServiceGeolocationDbIpMmdb({ databasePath: environment['GEOLOCATION_DBIP_DATABASE_PATH'] ?? '' });
			break;
		case 'ipinfo-hosted':
			geolocationService = new ServiceGeolocationIpInfoHosted({ token: environment['GEOLOCATION_IPINFO_TOKEN'] ?? '' });
			break;
		case 'ipinfo-mmdb':
			geolocationService = new ServiceGeolocationIpInfoMmdb({ databasePath: environment['GEOLOCATION_IPINFO_DATABASE_PATH'] ?? '' });
			break;
		case 'ip2location-bin':
			geolocationService = new ServiceGeolocationIp2LocationBin({ databasePath: environment['GEOLOCATION_IP2LOCATION_DATABASE_PATH'] ?? '' });
			break;
		case 'ip2location-hosted':
			geolocationService = new ServiceGeolocationIp2LocationHosted({ apiKey: environment['GEOLOCATION_IP2LOCATION_API_KEY'] });
			break;
		case 'maxmind-hosted':
			geolocationService = new ServiceGeolocationMaxMindHosted({
				accountId: environment['GEOLOCATION_MAXMIND_ACCOUNT_ID'] ?? '',
				licenseKey: environment['GEOLOCATION_MAXMIND_LICENSE_KEY'] ?? '',
			});
			break;
		case 'maxmind-mmdb':
			geolocationService = new ServiceGeolocationMaxMindMmdb({ databasePath: environment['GEOLOCATION_MAXMIND_DATABASE_PATH'] ?? '' });
			break;
		default:
			throw new Error('GEOLOCATION_PROVIDER must be dbip-hosted, dbip-mmdb, ip2location-bin, ip2location-hosted, ipinfo-hosted, ipinfo-mmdb, maxmind-hosted, or maxmind-mmdb');
	}

	return { geolocationService, geolocationTrustedIpHeader };
};
