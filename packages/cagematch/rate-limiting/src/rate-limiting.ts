import type { ServiceBase } from '@cellix/api-services-spec';

/** Identifies a stable application feature that may be rate limited. */
export type RateLimitFeature = string;

/** Stable account classifications that can refine a feature policy. */
export type RateLimitAccountType = 'anonymous' | 'account' | 'staff';

/**
 * Identifies the caller whose feature usage is counted.
 *
 * `id` must be stable and unique within the tenant. For anonymous traffic, the
 * caller must supply a privacy-safe client identifier rather than one shared
 * literal value when an anonymous policy is configured.
 */
export interface RateLimitSubject {
	readonly id: string;
	readonly accountType: RateLimitAccountType;
	readonly tenantId?: string;
	/** Stable staff authorization role; tenant-defined account roles are intentionally unsupported. */
	readonly staffRole?: string;
}

/**
 * Defines a fixed-window limit for a feature.
 *
 * A feature-only policy is the fallback. An `accountType` policy overrides it,
 * and a staff-role policy is the most specific match.
 */
export interface RateLimitPolicy {
	readonly feature: RateLimitFeature;
	readonly accountType?: RateLimitAccountType;
	readonly staffRole?: string;
	readonly limit: number;
	readonly windowMs: number;
	readonly cost?: number;
}

/** Describes one feature attempt before its most-specific policy is resolved. */
export interface RateLimitRequest {
	readonly feature: RateLimitFeature;
	readonly subject: RateLimitSubject;
	readonly cost?: number;
	readonly now?: Date;
}

/** The backend-neutral result of consuming capacity for a feature. */
export interface RateLimitDecision {
	readonly allowed: boolean;
	readonly feature: RateLimitFeature;
	readonly accountType: RateLimitAccountType;
	readonly limit: number | null;
	readonly remaining: number | null;
	readonly resetAt: Date | null;
	readonly retryAfterMs: number | null;
}

/** Backend-neutral fixed-window counter request used by every contender. */
export interface RateLimitStoreRequest {
	readonly key: string;
	readonly limit: number;
	readonly windowMs: number;
	readonly cost: number;
	readonly now: Date;
}

/** Backend contract implemented by each cage-match contender. */
export interface RateLimitStore {
	consume(request: RateLimitStoreRequest): Promise<RateLimitStoreDecision>;
}

/** Backend-neutral counter result. */
export interface RateLimitStoreDecision {
	readonly allowed: boolean;
	readonly remaining: number;
	readonly resetAt: Date;
}

/** Facade consumed by application services. */
export interface RateLimitingService {
	consume(request: RateLimitRequest): Promise<RateLimitDecision>;
}

/** Lifecycle contract implemented by each cage-match contender. */
export interface RateLimitingServiceImplementation extends RateLimitingService {
	startUp(): Promise<void>;
	shutDown(): Promise<void>;
}

/**
 * Cellix infrastructure service that delegates to the selected contender.
 *
 * @example
 * ```ts
 * const service = new ServiceRateLimiting(redisImplementation);
 * await service.startUp();
 * await service.consume({
 *   feature: 'community.create',
 *   subject: { id: 'account-123', accountType: 'account' },
 * });
 * ```
 */
export class ServiceRateLimiting implements ServiceBase<RateLimitingService>, RateLimitingService {
	private readonly implementation: RateLimitingServiceImplementation;
	private started = false;

	constructor(implementation: RateLimitingServiceImplementation) {
		this.implementation = implementation;
	}

	public async startUp(): Promise<RateLimitingService> {
		await this.implementation.startUp();
		this.started = true;
		return this;
	}

	public async shutDown(): Promise<void> {
		if (!this.started) {
			return;
		}
		this.started = false;
		await this.implementation.shutDown();
	}

	public async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
		if (!this.started) {
			throw new Error('ServiceRateLimiting is not started');
		}
		return await this.implementation.consume(request);
	}
}

/**
 * Resolves the most-specific policy for a feature and subject.
 *
 * Specificity is deterministic and does not depend on configuration order:
 * staff role, then account type, then feature fallback.
 */
export function resolveRateLimitPolicy(policies: readonly RateLimitPolicy[], feature: RateLimitFeature, subject: RateLimitSubject): RateLimitPolicy | undefined {
	let match: RateLimitPolicy | undefined;
	let matchSpecificity = -1;
	for (const policy of policies) {
		if (policy.feature !== feature || (policy.accountType !== undefined && policy.accountType !== subject.accountType) || (policy.staffRole !== undefined && policy.staffRole !== subject.staffRole)) {
			continue;
		}
		const specificity = policy.staffRole === undefined ? (policy.accountType === undefined ? 0 : 1) : 2;
		if (specificity > matchSpecificity) {
			match = policy;
			matchSpecificity = specificity;
		}
	}
	return match;
}

/**
 * Builds an isolated fixed-window key for one tenant, account class, subject,
 * and feature. Staff role is omitted so a role change cannot reset capacity.
 */
export function createRateLimitKey(request: RateLimitRequest, windowStartMs: number): string {
	const tenantId = encodeURIComponent(request.subject.tenantId ?? 'global');
	const accountType = encodeURIComponent(request.subject.accountType);
	const subjectId = encodeURIComponent(request.subject.id);
	const feature = encodeURIComponent(request.feature);
	return `cagematch:rate-limit:${tenantId}:${accountType}:${subjectId}:${feature}:${windowStartMs}`;
}

/**
 * Creates a policy-resolving facade around a backend counter store.
 *
 * Features without a matching policy are explicitly allowed and do not touch
 * the store. Invalid or ambiguous policy configuration fails at construction.
 */
export function createRateLimitingService(store: RateLimitStore, policies: readonly RateLimitPolicy[]): RateLimitingService {
	validatePolicies(policies);
	return {
		async consume(request): Promise<RateLimitDecision> {
			const policy = resolveRateLimitPolicy(policies, request.feature, request.subject);
			if (!policy) {
				return {
					allowed: true,
					feature: request.feature,
					accountType: request.subject.accountType,
					limit: null,
					remaining: null,
					resetAt: null,
					retryAfterMs: null,
				};
			}

			const cost = request.cost ?? policy.cost ?? 1;
			if (!Number.isInteger(cost) || cost < 1 || cost > policy.limit) {
				throw new RangeError(`Rate-limit cost must be an integer between 1 and ${policy.limit}`);
			}

			const now = request.now ?? new Date();
			if (!Number.isFinite(now.getTime())) {
				throw new RangeError('Rate-limit request now must be a valid date');
			}
			const windowStartMs = Math.floor(now.getTime() / policy.windowMs) * policy.windowMs;
			const storeDecision = await store.consume({
				key: createRateLimitKey(request, windowStartMs),
				limit: policy.limit,
				windowMs: policy.windowMs,
				cost,
				now,
			});

			return {
				allowed: storeDecision.allowed,
				feature: request.feature,
				accountType: request.subject.accountType,
				limit: policy.limit,
				remaining: storeDecision.remaining,
				resetAt: storeDecision.resetAt,
				retryAfterMs: storeDecision.allowed ? null : Math.max(0, storeDecision.resetAt.getTime() - now.getTime()),
			};
		},
	};
}

function validatePolicies(policies: readonly RateLimitPolicy[]): void {
	const selectors = new Set<string>();
	for (const policy of policies) {
		if (policy.feature.trim().length === 0) {
			throw new RangeError('Rate-limit policy feature must not be empty');
		}
		if (!Number.isInteger(policy.limit) || policy.limit < 1) {
			throw new RangeError('Rate-limit policy limit must be a positive integer');
		}
		if (!Number.isInteger(policy.windowMs) || policy.windowMs < 1_000) {
			throw new RangeError('Rate-limit policy windowMs must be at least 1,000 milliseconds');
		}
		if (policy.cost !== undefined && (!Number.isInteger(policy.cost) || policy.cost < 1 || policy.cost > policy.limit)) {
			throw new RangeError(`Rate-limit policy cost must be an integer between 1 and ${policy.limit}`);
		}
		if (policy.staffRole !== undefined && policy.accountType !== 'staff') {
			throw new RangeError('Rate-limit policy staffRole requires accountType "staff"');
		}
		const selector = `${policy.feature}\u0000${policy.accountType ?? '*'}\u0000${policy.staffRole ?? '*'}`;
		if (selectors.has(selector)) {
			throw new RangeError(`Duplicate rate-limit policy selector for feature ${policy.feature}`);
		}
		selectors.add(selector);
	}
}
