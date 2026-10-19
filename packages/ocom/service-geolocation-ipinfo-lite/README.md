# `@ocom/service-geolocation-ipinfo-lite`

Server-side country-level adapter for the free IPinfo Lite API. Supply an IPinfo token; the adapter calls `https://api.ipinfo.io/lite/{ip}` over HTTPS and sends the token in a Bearer authorization header. It does not need or manage a local database file.

IPinfo Lite provides country/continent and basic ASN data for IPv4 and IPv6. This adapter maps `country_code` to `countryCode` and `country` to `countryName` in the shared contract. The provider documents unlimited API access for Lite. Attribution is required under the IPinfo Lite data license; review the current terms for your use.

```ts
import { ServiceGeolocationIpInfoLite } from '@ocom/service-geolocation-ipinfo-lite';

const service = new ServiceGeolocationIpInfoLite({ token: process.env.GEOLOCATION_IPINFO_LITE_TOKEN! });
await service.startUp();
const result = await service.lookup('8.8.8.8');
console.info(result?.countryCode, result?.countryName);
await service.shutDown();
```

The adapter rejects invalid addresses, use before startup, and provider failures. It returns `null` for HTTP 404 or a successful response with no country information. Keep the token in server-side secret configuration.