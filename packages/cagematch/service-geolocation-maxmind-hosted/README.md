# `@ocom/service-geolocation-maxmind-hosted`

Hosted MaxMind City web-service adapter for `@cellix/service-geolocation-base`.

Requires a MaxMind account ID and license key. The adapter defaults to `geoip.maxmind.com`, supports the `geolite.info`/sandbox hosts, and uses the SDK's 3-second default timeout unless configured otherwise. Every lookup sends the requested IP to MaxMind and depends on outbound network access and the account's service entitlement.