import type { GeolocationLookupResult } from '@cellix/service-geolocation-base';

/** Provider-neutral observation persisted after a geolocation lookup. */
export interface GeolocationLookupRecord {
	readonly provider: string;
	readonly result: GeolocationLookupResult | null;
	readonly lookedUpAt: Date;
}

/** Append-only port for storing request geolocation observations. */
export interface GeolocationLookupStore {
	record(lookup: GeolocationLookupRecord): Promise<void>;
}
