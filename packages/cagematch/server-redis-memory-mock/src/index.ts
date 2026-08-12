import { type RedisMemoryServerConfig, startRedisMemoryServer } from '@cagematch/server-redis-memory-mock-seedwork';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const { HOST, PORT, REDIS_VERSION } = process.env;

const config: RedisMemoryServerConfig = {
	host: HOST ?? '127.0.0.1',
	port: Number(PORT ?? 51_000),
	...(REDIS_VERSION ? { binaryVersion: REDIS_VERSION } : {}),
};

startRedisMemoryServer(config).catch((error: unknown) => {
	console.error('Failed to start mock Redis:', error);
	process.exit(1);
});
