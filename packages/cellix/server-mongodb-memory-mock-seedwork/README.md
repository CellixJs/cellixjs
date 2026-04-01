# @cellix/server-mongodb-memory-mock-seedwork

Spin up a local, single-node MongoDB replica set in memory for development and tests.

⚠️ **For local development and testing only. Never use in production.**

Provides reusable startup logic around `mongodb-memory-server` for app-level local Mongo mock services.

## Features

- Single-node replica set (transactions-ready)
- Pinned MongoDB binary version for reproducibility (currently 7.0.14)
- Simple configuration via an explicit startup config object

## Prerequisites

- Internet access on first run (binary download/cache)

## Usage

In CellixJS, the runnable Mongo mock process lives in `@apps/server-mongodb-memory-mock`. This seedwork package exports the reusable startup function consumed by that app package.

- Build the seedwork package:

	```bash
	pnpm --filter @cellix/server-mongodb-memory-mock-seedwork run build
	```

- Run the CellixJS Mongo mock app:

	```bash
	pnpm --filter @apps/server-mongodb-memory-mock run dev
	```

The process will log the replica set connection URI, for example:

```
MongoDB Memory Replica Set ready at: mongodb://127.0.0.1:50000/test?replicaSet=rs0
```

⚠️ Data is in-memory and ephemeral. Stop and restart the service to reset to a clean state.

## Configuration

The app package supplies runtime configuration such as:

- `port`
- `dbName`
- `replSetName`
- optional `binaryVersion`

## Using the URI in your app (Mongoose)

```ts
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:50000/cellix_local?replicaSet=rs0';
await mongoose.connect(uri);

// ...use your models...
```

You can also use the native driver similarly.

## CellixJS integration

CellixJS configures this seedwork through the `@apps/server-mongodb-memory-mock` app package, and `@apps/api` reads its Mongo connection from `apps/api/local.settings.json`:

- `COSMOSDB_CONNECTION_STRING`
- `COSMOSDB_DBNAME` (optional)

Ensure these match the URI printed by this service (db name + `replicaSet`).

An app using this seedwork could produce defaults like:

```json
{
	"Values": {
		"COSMOSDB_CONNECTION_STRING": "mongodb://127.0.0.1:50000/test?replicaSet=rs0",
		"COSMOSDB_DBNAME": "test"
	}
}
```

CellixJS sets its app-level defaults to match `@apps/api` expectations:

```ini
PORT=50000
DB_NAME=owner-community
REPL_SET_NAME=globaldb
```

## Troubleshooting

| Symptom                  | Fix                                                                 |
| ------------------------ | ------------------------------------------------------------------- |
| Port already in use       | Change the app package's configured port.                           |
| Binary download issues    | Ensure internet connectivity or pre-warm the cache on CI. If downloads are slow/flaky, retry or check your network. |
| Transactions not working  | Use the printed URI which includes `replicaSet=...` and ensure your client connects with that URI. |

## Notes

- This package now exposes a programmatic startup function for app-level mock services.
- The MongoDB version is pinned in the code to ensure consistent local behavior across machines.
