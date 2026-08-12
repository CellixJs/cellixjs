import { RedisMemoryServer } from 'redis-memory-server';

/** Configuration for one isolated embedded Redis process. */
export interface RedisMemoryServerConfig {
	/** Interface to bind. Defaults to loopback. */
	readonly host?: string;
	/** Fixed port, or omit to select a free port. */
	readonly port?: number;
	/** Redis source version understood by `redis-memory-server`. */
	readonly binaryVersion?: string;
}

/** Idempotent lifecycle handle for an embedded Redis process. */
export interface RedisMemoryServerDisposer {
	stop(): Promise<void>;
}

/** Connection information returned after Redis is accepting commands. */
export interface StartedRedisMemoryServer {
	readonly host: string;
	readonly port: number;
	readonly connectionString: string;
	readonly disposer: RedisMemoryServerDisposer;
}

/**
 * Starts an isolated Redis process and returns its connection information.
 *
 * @param config - Optional bind address, fixed port, and Redis binary version.
 * @returns Connection information and an idempotent disposer after Redis is ready.
 * @throws When the binary cannot be prepared or the requested address cannot bind.
 *
 * @example
 * ```ts
 * const redis = await startRedisMemoryServer({ port: 51_000 });
 * await redis.disposer.stop();
 * ```
 */
export async function startRedisMemoryServer(config: RedisMemoryServerConfig = {}): Promise<StartedRedisMemoryServer> {
	const server = await RedisMemoryServer.create({
		instance: {
			ip: config.host ?? '127.0.0.1',
			...(config.port === undefined ? {} : { port: config.port }),
		},
		...(config.binaryVersion === undefined ? {} : { binary: { version: config.binaryVersion } }),
	});
	const host = await server.getHost();
	const port = await server.getPort();
	const connectionString = `redis://${host.includes(':') ? `[${host}]` : host}:${port}`;
	let stopped = false;

	console.log('Redis Memory Server ready at:', connectionString);

	return {
		host,
		port,
		connectionString,
		disposer: {
			stop: async () => {
				if (stopped) return;
				stopped = true;
				console.log('Stopping Redis Memory Server');
				await server.stop();
			},
		},
	};
}
