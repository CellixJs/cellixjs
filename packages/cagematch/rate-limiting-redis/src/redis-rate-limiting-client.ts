import { createClient, type RedisClientOptions } from 'redis';
import { consumeRateLimitScript, type ConsumeRateLimitCommand } from './consume-rate-limit.script.ts';

/**
 * Standard Node Redis connection options accepted by the client factory.
 *
 * Custom scripts are intentionally excluded because this package owns the
 * command name and atomic counter implementation.
 */
export type RedisRateLimitingClientOptions = Omit<RedisClientOptions, 'scripts'> & {
	/** Receives Redis connection and reconnection errors. */
	readonly onError?: (error: Error) => void;
};

/**
 * Narrow client contract required by the Redis rate-limiting service.
 *
 * Applications normally obtain this client from
 * {@link createRedisRateLimitingClient}. The structural contract remains
 * public so consumers can supply controlled test doubles without depending on
 * Node Redis internals.
 */
export interface RedisRateLimitingClient {
	/** Whether the underlying client currently has an open socket. */
	readonly isOpen?: boolean;
	/** Opens the dedicated Redis connection. */
	connect(): Promise<unknown>;
	/** Gracefully closes the dedicated Redis connection. */
	quit(): Promise<unknown>;
	/**
	 * Atomically consumes capacity from one fixed-window counter.
	 *
	 * @param command - Counter key, requested cost, limit, and remaining lifetime.
	 * @returns The script decision; the internal store validates its shape.
	 */
	consumeRateLimit(command: ConsumeRateLimitCommand): Promise<unknown>;
}

/**
 * Creates a dedicated Node Redis client with the atomic rate-limit command.
 *
 * Node Redis executes the registered command through `EVALSHA` and retries
 * with `EVAL` when Redis reports `NOSCRIPT`. The service owns connecting and
 * quitting the returned client.
 *
 * @param options - Standard Node Redis client options except custom scripts.
 * @returns A disconnected client ready for `ServiceRedisRateLimiting`.
 *
 * @example
 * ```ts
 * const client = createRedisRateLimitingClient({
 *   url: process.env.REDIS_URL,
 * });
 * ```
 */
export function createRedisRateLimitingClient(options: RedisRateLimitingClientOptions): RedisRateLimitingClient {
	const { onError = reportRedisError, ...clientOptions } = options;
	return createClient({
		...clientOptions,
		scripts: {
			consumeRateLimit: consumeRateLimitScript,
		},
	}).on('error', onError);
}

function reportRedisError(error: Error): void {
	console.error('[ServiceRedisRateLimiting] Redis client error', error);
}
