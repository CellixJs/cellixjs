import { isIP } from 'node:net';
import type { GeolocationLookupResult } from '@cellix/service-geolocation-base';
import type { GeolocationTrustedIpHeader } from '@ocom/context-spec';
import type { GeolocationLookupStore } from '@ocom/persistence';

export type TrustedRequestIpHeader = GeolocationTrustedIpHeader;

export interface RequestIpHeaders {
	readonly forwardedFor: string | undefined;
	readonly azureClientIp: string | undefined;
	readonly azureSocketIp: string | undefined;
	readonly realIp: string | undefined;
}

export interface GeolocationLookupProvider {
	readonly provider: string;
	lookup(ip: string): Promise<GeolocationLookupResult | null>;
}

export interface GeolocationApplicationService {
	captureRequest(headers: RequestIpHeaders | undefined): Promise<GeolocationLookupResult | null>;
}

/**
 * Creates request geolocation orchestration around a provider and append-only store.
 * Only the configured header is considered, and it must contain exactly one valid IP.
 * The raw IP is passed to the provider but is not included in the stored observation.
 */
export const createGeolocationApplicationService = (
	geolocationService: GeolocationLookupProvider | undefined,
	lookupStore: GeolocationLookupStore,
	trustedHeader: TrustedRequestIpHeader | undefined,
): GeolocationApplicationService => ({
	async captureRequest(headers) {
		if (!geolocationService || !headers || !trustedHeader) {
			return null;
		}
		const ip = headers[trustedHeader]?.trim();
		if (!ip || isIP(ip) === 0) {
			return null;
		}

		const result = await geolocationService.lookup(ip);
		await lookupStore.record({
			provider: geolocationService.provider,
			result,
			lookedUpAt: new Date(),
		});
		return result;
	},
});
