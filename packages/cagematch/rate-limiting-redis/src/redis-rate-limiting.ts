import {
	createRateLimitingService,
	type RateLimitingService,
	type RateLimitingServiceImplementation,
	type RateLimitPolicy,
	type RateLimitRequest,
	type RateLimitStore,
	type RateLimitStoreDecision,
	type RateLimitStoreRequest,
} from '@cagematch/rate-limiting';
import { readConsumeRateLimitResult } from './consume-rate-limit.script.ts';
import type { RedisRateLimitingClient } from './redis-rate-limiting-client.ts';

class RedisRateLimitStore implements RateLimitStore {
	private readonly client: RedisRateLimitingClient;

	constructor(client: RedisRateLimitingClient) {
		this.client = client;
	}

	public async consume(request: RateLimitStoreRequest): Promise<RateLimitStoreDecision> {
		const windowStartMs = Math.floor(request.now.getTime() / request.windowMs) * request.windowMs;
		const resetAt = new Date(windowStartMs + request.windowMs);
		const ttlSeconds = Math.max(1, Math.ceil((resetAt.getTime() - request.now.getTime()) / 1_000));
		const result = readConsumeRateLimitResult(
			await this.client.consumeRateLimit({
				key: request.key,
				cost: request.cost,
				limit: request.limit,
				ttlSeconds,
			}),
		);
		return {
			...result,
			resetAt,
		};
	}
}

/**
 * Redis implementation of the shared rate-limiting service contract.
 *
 * The service owns the lifecycle of its dedicated registered-script client.
 * Call {@link startUp} before consuming requests and {@link shutDown} when the
 * application stops.
 *
 * @example
 * ```ts
 * const client = createRedisRateLimitingClient({ url: process.env.REDIS_URL });
 * const service = new ServiceRedisRateLimiting(client, policies);
 * await service.startUp();
 * const decision = await service.consume(request);
 * ```
 *
 * @param client - Dedicated client created by `createRedisRateLimitingClient`
 * or a structurally compatible test double.
 * @param policies - Validated fixed-window policies shared with the facade.
 * @returns A lifecycle-managed Redis rate-limiting service instance.
 */
export class ServiceRedisRateLimiting implements RateLimitingServiceImplementation {
	private readonly client: RedisRateLimitingClient;
	private readonly service: RateLimitingService;
	private serviceStarted = false;

	constructor(client: RedisRateLimitingClient, policies: readonly RateLimitPolicy[]) {
		this.client = client;
		this.service = createRateLimitingService(new RedisRateLimitStore(client), policies);
	}

	public async startUp(): Promise<void> {
		if (this.serviceStarted) return;
		if (this.client.isOpen !== true) {
			await this.client.connect();
		}
		this.serviceStarted = true;
	}

	public async shutDown(): Promise<void> {
		if (!this.serviceStarted) return;
		this.serviceStarted = false;
		if (this.client.isOpen !== false) {
			await this.client.quit();
		}
	}

	public async consume(request: RateLimitRequest) {
		if (!this.serviceStarted) {
			throw new Error('ServiceRedisRateLimiting is not started');
		}
		return await this.service.consume(request);
	}
}
