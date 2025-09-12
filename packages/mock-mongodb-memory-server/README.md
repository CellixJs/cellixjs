# @cellix/mock-mongodb-memory-server

Spin up a local, single-node MongoDB replica set in memory for development and tests.

⚠️ **For local development and testing only. Never use in production.**

Wraps `mongodb-memory-server` to start a pinned MongoDB binary and prints a ready-to-use connection URI. Used across CellixJS to enable transactions without a real MongoDB instance.

## Features

- Single-node replica set (transactions-ready)
- Pinned MongoDB binary version for reproducibility (currently 7.0.14)
- Simple configuration via environment variables
- Loads env from `.env` and `.env.local` (with `.env.local` overriding)

## Prerequisites

- Internet access on first run (binary download/cache)

## Quick start

Note: this service starts automatically when running `npm run dev` at the repo root.

- Start emulator from repo root:

	```bash
	npm run start-emulator:mongo-memory-server
	```

- Or build and run from this package:

	```bash
	npm install
	npm run build
	npm start
	```

The process will log the replica set connection URI, for example:

```
MongoDB Memory Replica Set ready at: mongodb://127.0.0.1:50000/test?replicaSet=rs0
```

⚠️ Data is in-memory and ephemeral. Stop and restart the service to reset to a clean state.

## Configuration

These environment variables are supported:

- `PORT` — Port to expose the mongod instance (default: `50000`)
- `DB_NAME` — Database name to append to the URI (default: `test`)
- `REPL_SET_NAME` — Replica set name (default: `rs0`)

Environment loading order: `.env`, then `.env.local` (overrides).

Example `.env.local`:

```ini
PORT=50123
DB_NAME=cellix_local
REPL_SET_NAME=rs0
```

## Using the URI in your app (Mongoose)

```ts
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:50000/cellix_local?replicaSet=rs0';
await mongoose.connect(uri);

// ...use your models...
```

You can also use the native driver similarly.

## Align with @ocom/api

`@ocom/api` reads its Mongo connection from `packages/api/local.settings.json`:

- `COSMOSDB_CONNECTION_STRING`
- `COSMOSDB_DBNAME` (optional)

Ensure these match the URI printed by this service (db name + `replicaSet`).

Defaults here (`PORT=50000`, `DB_NAME=test`, `REPL_SET_NAME=rs0`) imply:

```json
{
	"Values": {
		"COSMOSDB_CONNECTION_STRING": "mongodb://127.0.0.1:50000/test?replicaSet=rs0",
		"COSMOSDB_DBNAME": "test"
	}
}
```

If keeping `@ocom/api` defaults (e.g., `owner-community` + `replicaSet=globaldb`), set this service’s `.env.local` accordingly:

```ini
PORT=50000
DB_NAME=owner-community
REPL_SET_NAME=globaldb
```

## Troubleshooting

| Symptom                  | Fix                                                                 |
| ------------------------ | ------------------------------------------------------------------- |
| Port already in use       | Change `PORT` in your `.env.local`.                                 |
| Binary download issues    | Ensure internet connectivity or pre-warm the cache on CI. If downloads are slow/flaky, retry or check your network. |
| Transactions not working  | Use the printed URI which includes `replicaSet=...` and ensure your client connects with that URI. |

## Notes

- This package currently exposes a simple runner. There is no programmatic API exported; it starts the replica set and prints the URI to stdout.
- The MongoDB version is pinned in the code to ensure consistent local behavior across machines.