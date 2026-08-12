import { type CommandParser, defineScript } from 'redis';

export interface ConsumeRateLimitCommand {
	readonly key: string;
	readonly cost: number;
	readonly limit: number;
	readonly ttlSeconds: number;
}

interface ConsumeRateLimitResult {
	readonly allowed: boolean;
	readonly remaining: number;
}

interface ConsumeRateLimitScript {
	readonly SCRIPT: string;
	readonly NUMBER_OF_KEYS: number;
	readonly IS_READ_ONLY: false;
	readonly SHA1: string;
	parseCommand(parser: CommandParser, command: ConsumeRateLimitCommand): void;
	transformReply(reply: unknown): ConsumeRateLimitResult;
}

/** Atomic fixed-window counter command used by the Redis rate-limiting client. */
export const consumeRateLimitScript: ConsumeRateLimitScript = defineScript({
	SCRIPT: `
local counterKey = KEYS[1]
local requestedCost = tonumber(ARGV[1])
local windowLimit = tonumber(ARGV[2])
local ttlSeconds = tonumber(ARGV[3])
local currentUsage = tonumber(redis.call('GET', counterKey))

if currentUsage == nil then
  redis.call('SET', counterKey, requestedCost, 'EX', ttlSeconds)
  return { 1, windowLimit - requestedCost }
end

local nextUsage = currentUsage + requestedCost
if nextUsage > windowLimit then
  return { 0, windowLimit - currentUsage }
end

redis.call('INCRBY', counterKey, requestedCost)
return { 1, windowLimit - nextUsage }
`,
	NUMBER_OF_KEYS: 1,
	IS_READ_ONLY: false,
	parseCommand(parser: CommandParser, command: ConsumeRateLimitCommand): void {
		parser.pushKey(command.key);
		parser.push(command.cost.toString(), command.limit.toString(), command.ttlSeconds.toString());
	},
	transformReply(reply: unknown): ConsumeRateLimitResult {
		if (!Array.isArray(reply) || reply.length !== 2) throw new Error('Invalid Redis rate-limit response');
		const allowed = Number(reply[0]);
		const remaining = Number(reply[1]);
		if (![0, 1].includes(allowed) || !Number.isFinite(remaining)) throw new Error('Invalid Redis rate-limit response');
		return { allowed: allowed === 1, remaining: Math.max(0, remaining) };
	},
});

export function readConsumeRateLimitResult(value: unknown): ConsumeRateLimitResult {
	if (typeof value !== 'object' || value === null || !('allowed' in value) || !('remaining' in value) || typeof value.allowed !== 'boolean' || typeof value.remaining !== 'number' || !Number.isFinite(value.remaining)) {
		throw new Error('Invalid Redis rate-limit response');
	}
	return { allowed: value.allowed, remaining: Math.max(0, value.remaining) };
}
