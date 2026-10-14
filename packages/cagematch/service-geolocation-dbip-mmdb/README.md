# `@ocom/service-geolocation-dbip-mmdb`

Local DB-IP City Lite MMDB adapter for `@cellix/service-geolocation-base`.

Configure `databasePath` with a provisioned DB-IP City Lite database. The adapter opens the database during `startUp()` using the typed MaxMind GeoIP2 reader and performs in-process City lookups; `shutDown()` releases the reader. The database is not included in this package and should be refreshed under DB-IP's licensing and attribution terms.

The reader expects the MaxMind-compatible City schema and maps country, first subdivision, city, and location coordinates. Invalid IPs and reader failures reject; an address absent from the database returns `null`.