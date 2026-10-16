# `@cellix/service-geolocation-base`

Provider-neutral contract for server-side IP geolocation services.

Implementations normalize their responses to `GeolocationLookupResult`, so application code can switch between a local MaxMind MMDB database, the MaxMind web service, and IPinfo without depending on vendor SDKs.

## Usage

```ts
import type { GeolocationService } from '@cellix/service-geolocation-base';

async function locate(service: GeolocationService, ip: string) {
	const location = await service.lookup(ip);
	return location?.countryCode ?? null;
}
```

`lookup` returns `null` when the provider has no record and rejects when the provider is unavailable or the lookup fails. Callers own retry, fallback, and request-continuation policy. The caller must select an IP only after applying its trusted-proxy policy.

Returned locations are approximate network locations, not household or street addresses. Fields are optional because provider datasets vary. Hosted lookups transmit the IP to the selected provider; review its terms and your retention policy before enabling them.