import { type CommandParser, defineScript, type RedisScripts } from 'redis';
import { FIXED_WINDOW_COUNTER_LUA } from './fixed-window-counter.lua.ts';

export interface ConsumeRateLimitCommand {
	readonly key: string;
	readonly cost: number;
	readonly limit: number;
	readonly ttlSeconds: number;
}

export interface ConsumeRateLimitResult {
	readonly allowed: boolean;
	readonly remaining: number;
}

/**
 * Node Redis protocol mapping for the fixed-window Lua algorithm.
 *
 * `defineScript` lets Node Redis use `EVALSHA` during normal operation and
 * transparently fall back to `EVAL` after Redis loses its script cache. This
 * module only maps the named TypeScript command to `KEYS`/`ARGV` and maps the
 * returned Redis tuple back to a named result.
 */
export const consumeRateLimitScript: RedisScripts[string] = defineScript({
	SCRIPT: FIXED_WINDOW_COUNTER_LUA,
	NUMBER_OF_KEYS: 1,
	IS_READ_ONLY: false,
	parseCommand(parser: CommandParser, command: ConsumeRateLimitCommand): void {
		parser.pushKey(command.key);
		parser.push(command.cost.toString(), command.limit.toString(), command.ttlSeconds.toString());
	},
	transformReply(reply: unknown): ConsumeRateLimitResult {
		return parseScriptReply(reply);
	},
});

/** Converts the raw Redis tuple returned by Lua into a named result. */
function parseScriptReply(reply: unknown): ConsumeRateLimitResult {
	if (!Array.isArray(reply) || reply.length !== 2) {
		throw new Error('Invalid Redis rate-limit response');
	}

	const allowedFlag = Number(reply[0]);
	const remaining = Number(reply[1]);
	if (![0, 1].includes(allowedFlag) || !Number.isFinite(remaining)) {
		throw new Error('Invalid Redis rate-limit response');
	}

	return {
		allowed: allowedFlag === 1,
		remaining: Math.max(0, remaining),
	};
}

/**
 * Validates the result at the public structural-client boundary.
 *
 * The registered Node Redis client already returns this named shape. The
 * additional check keeps custom clients and test doubles from leaking invalid
 * values into the backend-neutral rate-limit decision.
 */
export function readConsumeRateLimitResult(value: unknown): ConsumeRateLimitResult {
	if (!isConsumeRateLimitResult(value)) {
		throw new Error('Invalid Redis rate-limit response');
	}
	return { allowed: value.allowed, remaining: Math.max(0, value.remaining) };
}

function isConsumeRateLimitResult(value: unknown): value is ConsumeRateLimitResult {
	if (typeof value !== 'object' || value === null || !('allowed' in value) || !('remaining' in value)) {
		return false;
	}

	return typeof value.allowed === 'boolean' && typeof value.remaining === 'number' && Number.isFinite(value.remaining);
}
