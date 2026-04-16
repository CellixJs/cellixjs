import { buildBackoffSchedule } from "./internal/backoff.ts";

/**
 * Options for creating a retry policy.
 */
export interface RetryPolicyOptions {
	attempts: number;
	baseDelayMs: number;
}

/**
 * Public retry policy shape returned to consumers.
 */
export interface RetryPolicy {
	attempts: number;
	delays: number[];
}

/**
 * Create a deterministic retry policy for consumers that need bounded retries.
 *
 * @param options Retry configuration.
 * @returns A policy snapshot with the computed delay schedule.
 * @example
 * createRetryPolicy({ attempts: 3, baseDelayMs: 100 });
 */
export function createRetryPolicy(options: RetryPolicyOptions): RetryPolicy {
	return {
		attempts: options.attempts,
		delays: buildBackoffSchedule(options.attempts, options.baseDelayMs),
	};
}
