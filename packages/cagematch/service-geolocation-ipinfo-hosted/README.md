# `@ocom/service-geolocation-ipinfo-hosted`

IPinfo hosted lookup adapter for `@cellix/service-geolocation-base`.

Requires an IPinfo API token and outbound HTTPS access. The token is sent in the Authorization header rather than the URL. Requests use a 3-second timeout by default, return `null` on HTTP 404, and reject for other non-success statuses. IPinfo response fields do not include a city accuracy radius in this API shape.