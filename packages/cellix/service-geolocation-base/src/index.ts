/**
 * Provider-neutral country fields returned by a geolocation lookup.
 *
 * Providers may omit fields they cannot determine. The location is an approximate
 * network location and must not be treated as a physical address.
 */
export interface GeolocationLookupResult {
	readonly countryCode?: string;
	readonly countryName?: string;
	readonly provider: string;
}

/**
 * Provider-neutral capability for looking up approximate locations by IP address.
 *
 * Implementations normalize provider responses to {@link GeolocationLookupResult} and
 * return `null` when the address has no known location. Lookup failures should reject;
 * callers decide whether to continue the surrounding request or operation.
 *
 * @example
 * ```ts
 * const result = await geolocationService.lookup('198.51.100.42');
 * if (result) console.info(result.countryCode, result.countryName);
 * ```
 */
export interface GeolocationService {
	/** Stable identifier for the selected geolocation backend. */
	readonly provider: string;

	/**
	 * Looks up the approximate network location for an IPv4 or IPv6 address.
	 *
	 * @param ip - The address selected by the caller after applying its trusted-proxy policy.
	 * @returns A normalized location, or `null` when no location is known.
	 * @throws When the provider is not started or its lookup fails.
	 */
	lookup(ip: string): Promise<GeolocationLookupResult | null>;
}
