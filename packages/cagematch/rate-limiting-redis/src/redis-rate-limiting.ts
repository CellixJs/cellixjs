import {
	createRateLimitingService,
	type RateLimitPolicy,
	type RateLimitRequest,
	type RateLimitStore,
	type RateLimitStoreDecision,
	type RateLimitStoreRequest,
	type RateLimitingService,
	type RateLimitingServiceImplementation,
} from '@cagematch/rate-limiting';

export interface RedisCommandClient {
	sendCommand(command: string[]): Promise<unknown>;
	connect?(): Promise<unknown>;
	quit?(): Promise<unknown>;
}

const consumeScript = `
local current = redis.call('GET', KEYS[1])
local increment = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local ttlSeconds = tonumber(ARGV[3])

if not current then
  redis.call('SET', KEYS[1], increment, 'EX', ttlSeconds)
  return { 1, limit - increment }
end

current = tonumber(current)
if current + increment > limit then
  return { 0, math.max(0, limit - current) }
end

local updated = redis.call('INCRBY', KEYS[1], increment)
return { 1, limit - updated }
`;

/** Atomic Redis Lua fixed-window counter. */
export class RedisRateLimitStore implements RateLimitStore {
	private readonly client: RedisCommandClient;

	constructor(client: RedisCommandClient) {
		this.client = client;
	}

	public async consume(request: RateLimitStoreRequest): Promise<RateLimitStoreDecision> {
		const windowStartMs = Math.floor(request.now.getTime() / request.windowMs) * request.windowMs;
		const resetAt = new Date(windowStartMs + request.windowMs);
		const ttlSeconds = Math.max(1, Math.ceil((resetAt.getTime() - request.now.getTime()) / 1_000));
		const result = await this.client.sendCommand(['EVAL', consumeScript, '1', request.key, String(request.cost), String(request.limit), String(ttlSeconds)]);
		if (!Array.isArray(result) || result.length !== 2 || ![0, 1].includes(Number(result[0])) || !Number.isFinite(Number(result[1]))) {
			throw new Error('Invalid Redis rate-limit response');
		}

		const allowed = Number(result[0]) === 1;
		return {
			allowed,
			remaining: Math.max(0, Number(result[1])),
			resetAt,
		};
	}
}

/** Redis contender implementing the shared rate-limiting lifecycle contract. */
export class ServiceRedisRateLimiting implements RateLimitingServiceImplementation {
	private readonly client: RedisCommandClient;
	private readonly store: RedisRateLimitStore;
	private readonly policies: readonly RateLimitPolicy[];
	private serviceInternal: RateLimitingService | undefined;
	private serviceStarted = false;

	constructor(client: RedisCommandClient, policies: readonly RateLimitPolicy[]) {
		this.client = client;
		this.store = new RedisRateLimitStore(client);
		this.policies = policies;
	}

	public async startUp(): Promise<void> {
		if (this.client.connect) {
			await this.client.connect();
		}
		this.serviceInternal = createRateLimitingService(this.store, this.policies);
		this.serviceStarted = true;
	}

	public async shutDown(): Promise<void> {
		this.serviceInternal = undefined;
		this.serviceStarted = false;
		if (this.client.quit) {
			await this.client.quit();
		}
	}

	public async consume(request: RateLimitRequest) {
		if (!this.serviceStarted || !this.serviceInternal) {
			throw new Error('ServiceRedisRateLimiting is not started');
		}
		return await this.serviceInternal.consume(request);
	}
}
