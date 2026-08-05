# `@cagematch/server-redis-memory-mock-seedwork`

Reusable embedded Redis lifecycle support for local development and integration tests.

Like `mongodb-memory-server`, this package prepares a real server binary and starts an isolated child process. Commands, expiration, and Lua scripts therefore run in Redis rather than in a JavaScript mock.

```ts
import { startRedisMemoryServer } from '@cagematch/server-redis-memory-mock-seedwork';

const redis = await startRedisMemoryServer({ port: 51_000 });
console.log(redis.connectionString);

await redis.disposer.stop();
```

Omit `port` in parallel tests to select an available port. The first installation can be slower while Redis is downloaded and compiled; later starts use the binary cache.
