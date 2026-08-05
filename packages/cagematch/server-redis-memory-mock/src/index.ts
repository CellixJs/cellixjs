import { startRedisMemoryServer, type RedisMemoryServerConfig, type StartedRedisMemoryServer } from '@cagematch/server-redis-memory-mock-seedwork';

export type RedisMemoryServerEnvironment = Partial<Record<'HOST' | 'PORT' | 'REDIS_VERSION', string>>;
export type RedisMemoryServerStarter = (config: RedisMemoryServerConfig) => Promise<StartedRedisMemoryServer>;

/** Resolves application environment defaults without starting Redis. */
export function resolveRedisMemoryServerConfig(env: RedisMemoryServerEnvironment): RedisMemoryServerConfig {
	const port = Number(env.PORT ?? 51_000);
	if (!Number.isInteger(port)) {
		throw new RangeError('Redis memory server PORT must be an integer');
	}
	if (port < 1 || port > 65_535) {
		throw new RangeError('Redis memory server PORT must be between 1 and 65535');
	}
	return {
		host: env.HOST ?? '127.0.0.1',
		port,
		...(env.REDIS_VERSION ? { binaryVersion: env.REDIS_VERSION } : {}),
	};
}

/**
 * Starts the cage-match Redis server using application environment configuration.
 *
 * @param env - Environment values; defaults to `process.env`.
 * @param startServer - Injectable generic starter used by contract tests.
 * @returns The started server connection information and disposer.
 */
export function startAppRedisMemoryServer(env: RedisMemoryServerEnvironment = process.env, startServer: RedisMemoryServerStarter = startRedisMemoryServer): Promise<StartedRedisMemoryServer> {
	return startServer(resolveRedisMemoryServerConfig(env));
}
