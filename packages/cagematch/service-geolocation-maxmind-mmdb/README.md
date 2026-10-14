# `@ocom/service-geolocation-maxmind-mmdb`

Local MaxMind City MMDB adapter for `@cellix/service-geolocation-base`.

Configure `databasePath` with a licensed MaxMind City database available to the Function App. The adapter opens the database during `startUp()` and performs synchronous in-process lookups thereafter; `shutDown()` releases the reader. The database file is not included in this package and must be provisioned and refreshed under the applicable MaxMind license.

The adapter does not make external lookup calls, but its results can still be approximate or absent. It rejects invalid IPs and returns `null` when the database has no record.