# `@ocom/service-geolocation-ip2location-hosted`

Hosted IP2Location.io adapter for `@cellix/service-geolocation-base`. It calls the HTTPS JSON endpoint at `https://api.ip2location.io/` and normalizes `country_code`, `country_name`, `region_name`, `city_name`, `latitude`, and `longitude` into the shared geolocation result.

```ts
import { ServiceGeolocationIp2LocationHosted } from '@ocom/service-geolocation-ip2location-hosted';

const service = new ServiceGeolocationIp2LocationHosted({
	apiKey: process.env.IP2LOCATION_API_KEY,
});
await service.startUp();
const location = await service.lookup('198.51.100.42');
```

An API key is optional; IP2Location.io documents keyless access with a daily query limit. When supplied, the key is sent using Bearer authentication. Requests use a 3-second timeout by default; pass `timeoutMs` to change it. An empty successful response returns `null`; HTTP failures and API error objects reject. Both IPv4 and IPv6 addresses are supported by the API.