# Geolocation cagematch

This workspace verifies the provider-neutral lookup path and compares nine adapters: IPinfo Hosted, Lite, and Core MMDB; MaxMind Hosted and MMDB; DB-IP Hosted and City Lite MMDB; and IP2Location.io Hosted and BIN.

`pnpm --filter @ocom-verification/cagematch test` starts an in-memory MongoDB and exercises the application-service lookup through `@ocom/persistence`. Each provider receives the same synthetic RFC 5737 client address through the shared HTTP header extractor. A conflicting `x-forwarded-for` value is also present; a second request supplies an ambiguous comma-separated address list. Injected provider responses make the evaluation deterministic and credential-free. The test checks source selection, rejection before backend access, normalized results, and privacy of the persisted observation.

## Scored rubric

The 100-point score is a deterministic integration score, not a provider quality or accuracy score. Every criterion is computed in the Mongo-backed per-provider test. A field earns points only when it is present in that adapter's injected fixture and returned through the shared contract. Missing fixture fields score zero.

| Criterion | Weight | IPinfo Hosted | IPinfo Lite | IPinfo MMDB | MaxMind Hosted | MaxMind MMDB | DB-IP Hosted | DB-IP MMDB | IP2Location Hosted | IP2Location BIN |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Selects the configured trusted Azure client-IP header | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 |
| Ignores a conflicting, untrusted forwarded header | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| Rejects a comma-separated IP list before backend access or persistence | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| Normalizes country code | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Normalizes region | 6 | 6 | 0 | 6 | 6 | 6 | 6 | 6 | 6 |
| Normalizes city | 6 | 6 | 0 | 6 | 6 | 6 | 6 | 6 | 6 |
| Normalizes latitude | 6 | 6 | 0 | 6 | 6 | 6 | 6 | 6 | 6 |
| Normalizes longitude | 6 | 6 | 0 | 6 | 6 | 6 | 6 | 6 | 6 |
| Maps country name into the common result | 10 | 0 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| Maps accuracy radius into the common result | 10 | 0 | 0 | 0 | 10 | 10 | 0 | 10 | 0 | 0 |
| Persists the normalized observation | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| Omits the raw source IP from persisted data | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| **Total** | **100** | **80** | **66** | **90** | **100** | **100** | **90** | **100** | **90** | **90** |

The 100-point result means the adapter passed these specific contract fixtures. It does not mean it has better geographic truth, coverage, uptime, security certification, or value for money. Metadata points are about current adapter mappings and fixture records, not a guarantee that a live plan or every database release returns the field. IPinfo Lite's 66 reflects that its product is country-level and the adapter intentionally does not claim region, city, coordinates, or accuracy radius; for a country-only requirement, that city-oriented total is not a measure of product fit. All providers tie on the shared request boundary and privacy behavior in this test; those rows are requirements, not differentiators.

## Operational comparison

The dimensions below are filled from adapter implementation and provider product documentation. These are factual decision inputs, not additional numeric points: price, coverage, support, and update policies vary by plan and can change. Confirm them for the exact product and contract before production use.

| Option | Lookup mode and network | Provisioning and ongoing work | Authentication or quota | Common city fields and extras | IPv6 considerations | License and attribution notes |
| --- | --- | --- | --- | --- | --- | --- |
| IPinfo Hosted | Remote HTTPS request per lookup | Provider operates service and data; application needs outbound network access | Runtime token required | Country code, region, city, coordinates; this adapter does not map country name or radius | Provider API documents IPv4 and IPv6 lookup | Terms and availability depend on subscribed IPinfo product |
| IPinfo Lite | Remote HTTPS request per lookup | Provider operates service and data; application needs outbound network access; no local database file to acquire or refresh | Runtime token required; IPinfo describes Lite API access as unlimited | Country code and country name; country/continent and basic ASN dataset; no region, city, coordinates, or radius mapping | IPinfo Lite documents IPv4 and IPv6 | Attribution is required; review the current Lite data license and terms for your use |
| IPinfo Core MMDB | Local MMDB lookup; no lookup-time network | Obtain Core database access and provision/refresh file; IPinfo documents daily data updates | No per-lookup token; database access is provisioned separately | Country name/code, region, city, coordinates; no radius mapping in this adapter | Core documents IPv4 and IPv6 data | Follow the license for the specific Core database product |
| MaxMind Hosted | Remote GeoIP2 City service | Provider operates service; application needs outbound network access | Account ID and license key | Country name/code, region, city, coordinates, accuracy radius | GeoIP city service supports IPv4 and IPv6 | GeoIP product terms apply; database/service access is licensed |
| MaxMind MMDB | Local City MMDB lookup; no lookup-time network | Provision database and automate refresh; no file bundled with adapter | No per-lookup credential; database download access is separate | Country name/code, region, city, coordinates, accuracy radius | Select a City database with IPv4 and IPv6 blocks | GeoIP/GeoLite terms differ; review the selected product's EULA and attribution requirements |
| DB-IP Hosted | Remote HTTPS v2 API | Provider operates service; application needs outbound network access | API key; quota and HTTPS availability depend on plan | Country name/code, region, city, coordinates; no radius mapping in this adapter | Validate current plan/API support for the target address | API terms and quota are plan-specific |
| DB-IP City Lite MMDB | Local MMDB lookup; no lookup-time network | Monthly Lite snapshot; deployer owns download and refresh | No per-lookup credential | Country name/code, region, city, coordinates; adapter maps radius when present in schema | Lite City files include IP geolocation data; test selected file for both families | CC BY 4.0 attribution is required; Lite has reduced coverage/accuracy |
| IP2Location.io Hosted | Remote HTTPS API | Provider operates service; application needs outbound network access | Optional keyless use is limited to 1,000 queries/day; documented free API key tier has a monthly quota | Country name/code, region, city, coordinates; no radius mapping in this adapter | Provider documents IPv4 and IPv6 API lookups | API terms and quota apply; confirm plan limits |
| IP2Location BIN | Local BIN lookup; no lookup-time network | Provision BIN file and automate refresh; adapter opens/closes official reader | No per-lookup credential; database download/license is separate | Country name/code, region, city, coordinates; fields depend on BIN package | Select an IPv6-capable BIN; an IPv4-only file will not cover IPv6 | License depends on selected BIN product/package |

### Reading the comparison

- **Best fixture score:** MaxMind Hosted, MaxMind MMDB, and DB-IP City Lite MMDB tie at 100. This is only a tie on the test fixture's normalized fields and request/persistence behavior; it is not a data-accuracy ranking.
- **Lowest setup for a hosted trial:** IP2Location.io supports keyless API requests with a documented daily quota. The adapter also accepts an API key. A quota-limited trial should not be treated as a production capacity plan.
- **Local operation:** MMDB/BIN adapters remove lookup-time vendor network dependency but move data acquisition, licensing, updates, file availability, and rollback responsibility to the operator.
- **Attribution-sensitive option:** DB-IP City Lite is the clearly documented free local dataset here, but CC BY 4.0 attribution and its reduced coverage/accuracy are material constraints.
- **Privacy boundary:** All nine passed the same test that keeps the raw looked-up IP out of the saved observation. Hosted services still receive the lookup address over the network; the persistence guarantee does not remove that provider disclosure.

## Limits and live measurement

Synthetic reserved addresses do not represent routable subscribers and cannot measure geographic accuracy. The tests also do not measure regional coverage, uptime, live latency, actual per-plan response completeness, freshness, support, or total cost. Use a ground-truth dataset with consent and suitable safeguards to assess accuracy. Use an authorized routable test IP to measure latency and response fields, and retain results with test region, date, plan, database release, cache state, and iteration count.

The live benchmark makes real calls and requires `GEOLOCATION_CAGEMATCH_IP` plus configuration/data for every selected provider. `GEOLOCATION_CAGEMATCH_PROVIDERS` optionally selects a comma-separated subset; when omitted, all configured providers are run, and at least two must be configured. Supported configuration: `GEOLOCATION_IPINFO_TOKEN`, `GEOLOCATION_IPINFO_LITE_TOKEN`, `GEOLOCATION_IPINFO_DATABASE_PATH`, `GEOLOCATION_MAXMIND_ACCOUNT_ID` with `GEOLOCATION_MAXMIND_LICENSE_KEY`, `GEOLOCATION_MAXMIND_DATABASE_PATH`, `GEOLOCATION_DBIP_API_KEY`, `GEOLOCATION_DBIP_DATABASE_PATH`, `GEOLOCATION_IP2LOCATION_API_KEY`, and `GEOLOCATION_IP2LOCATION_DATABASE_PATH`. The IP2Location hosted API can be opted into without a key by setting `GEOLOCATION_IP2LOCATION_ENABLE_KEYLESS=true`; that consumes the provider's public quota. Optional `GEOLOCATION_CAGEMATCH_ITERATIONS` defaults to 5. Run it with `pnpm --filter @ocom-verification/cagematch benchmark`. Output reports measured latency, failures, and normalized field counts; it omits the tested IP and credentials.

## API configuration

Set `GEOLOCATION_PROVIDER` to one of `dbip-hosted`, `dbip-mmdb`, `ip2location-bin`, `ip2location-hosted`, `ipinfo-hosted`, `ipinfo-lite`, `ipinfo-mmdb`, `maxmind-hosted`, or `maxmind-mmdb`. For Lite, set `GEOLOCATION_IPINFO_LITE_TOKEN` in server-side secret configuration. Set `GEOLOCATION_TRUSTED_IP_HEADER` to an ingress header that the deployment actually controls (`x-azure-clientip`, `x-azure-socketip`, `x-forwarded-for`, or `x-real-ip`). With no selected provider, capture remains disabled. Do not trust forwarded headers unless the proxy chain is configured and enforced outside the application.

## Sources

- [IPinfo Core product, fields, formats, IPv4/IPv6, and update frequency](https://ipinfo.io/products/core)
- [IPinfo Lite product, fields, and free API access](https://ipinfo.io/lite)
- [IPinfo Lite license and attribution](https://ipinfo.io/developers/license)
- [IPinfo API and authentication documentation](https://ipinfo.io/developers/ipinfo-api)
- [MaxMind City and Country database documentation](https://dev.maxmind.com/geoip/docs/databases/city-and-country/)
- [DB-IP Lite downloads, update frequency, and license](https://db-ip.com/db/lite.php)
- [DB-IP API plans and response](https://db-ip.com/api/)
- [IP2Location.io API documentation, quotas, fields, and IPv6](https://www.ip2location.io/ip2location-documentation)
- [IP2Location database packages](https://www.ip2location.com/database/ip2location)