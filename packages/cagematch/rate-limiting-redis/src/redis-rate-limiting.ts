import { type RateLimitCounterDecision, type RateLimitCounterRequest, type RateLimitPolicy, ServiceRateLimiting } from '@cagematch/rate-limiting';
import { createClient } from 'redis';
import { type ConsumeRateLimitCommand, consumeRateLimitScript, readConsumeRateLimitResult } from './consume-rate-limit.script.ts';

interface RedisRateLimitingClient {
	readonly isOpen: boolean;
	connect(): Promise<unknown>;
	quit(): Promise<unknown>;
	on(event: 'error', listener: (error: Error) => void): RedisRateLimitingClient;
	consumeRateLimit(command: ConsumeRateLimitCommand): Promise<unknown>;
}

/** Optional overrides for the Redis connection owned by the service. */
export interface RedisRateLimitingOptions {
	/** Defaults to the universal `REDIS_URL` environment variable. */
	readonly url?: string;
	/** Receives Redis connection and reconnection errors. */
	readonly onError?: (error: Error) => void;
}

/**
 * Redis fixed-window rate-limiting service.
 *
 * The service creates and owns its Redis client. Applications normally supply
 * only policies and configure the connection through `REDIS_URL`.
 *
 * @example
 * ```ts
 * process.env.REDIS_URL = 'redis://127.0.0.1:6379';
 * const service = new ServiceRedisRateLimiting([
 *   { feature: 'document.create', limit: 5, windowMs: 60_000 },
 * ]);
 * ```
 */
export class ServiceRedisRateLimiting extends ServiceRateLimiting {
	private readonly client: RedisRateLimitingClient;

	constructor(policies: readonly RateLimitPolicy[], options: RedisRateLimitingOptions = {}) {
		super(policies);
		const env = process.env as Partial<Record<'REDIS_URL', string>>;
		const url = options.url ?? env.REDIS_URL;
		if (!url || url.trim().length === 0) throw new Error('REDIS_URL is required for Redis rate limiting');
		this.client = createClient({
			url,
			scripts: { consumeRateLimit: consumeRateLimitScript },
		}).on('error', options.onError ?? reportRedisError) as unknown as RedisRateLimitingClient;
	}

	protected override async onStartUp(): Promise<void> {
		if (!this.client.isOpen) await this.client.connect();
	}

	protected override async onShutDown(): Promise<void> {
		if (this.client.isOpen) await this.client.quit();
	}

	protected override async consumeCounter(request: RateLimitCounterRequest): Promise<RateLimitCounterDecision> {
		const windowStartMs = Math.floor(request.now.getTime() / request.windowMs) * request.windowMs;
		const resetAt = new Date(windowStartMs + request.windowMs);
		const result = readConsumeRateLimitResult(
			await this.client.consumeRateLimit({
				key: request.key,
				cost: request.cost,
				limit: request.limit,
				ttlSeconds: Math.max(1, Math.ceil((resetAt.getTime() - request.now.getTime()) / 1_000)),
			}),
		);
		return { ...result, resetAt };
	}
}

function reportRedisError(error: Error): void {
	console.error('[ServiceRedisRateLimiting] Redis client error', error);
}
