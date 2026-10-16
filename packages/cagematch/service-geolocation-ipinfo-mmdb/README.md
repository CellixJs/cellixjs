# @ocom/service-geolocation-ipinfo-mmdb

Local adapter for IPinfo Core MMDB files. Supply a provisioned IPinfo Core database path with `GEOLOCATION_IPINFO_DATABASE_PATH`; download access is separate from IPinfo's self-serve API plans. The adapter reads the flat IPinfo Core MMDB schema and maps country, region, city, and coordinates to the shared geolocation result.

The adapter performs no network calls at lookup time. Keep database download credentials out of runtime configuration and follow the license terms for the specific IPinfo database you provision.