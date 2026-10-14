# `@ocom/service-geolocation-dbip-hosted`

Hosted DB-IP geolocation API adapter for `@cellix/service-geolocation-base`.

Provide a DB-IP API key using `apiKey`. Lookups use DB-IP's HTTPS v2 endpoint and the built-in `fetch`; a compatible fetch implementation can be injected for tests or custom runtimes. The adapter maps country, region, city, and coordinates into the shared geolocation result. Keep API keys in server-side configuration.

Invalid IP addresses and provider failures reject the lookup. HTTP 404 responses return `null` for addresses with no result.