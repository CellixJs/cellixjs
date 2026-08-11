import type { ServiceBase } from '@cellix/api-services-spec';

/** Identifies an application-defined operation that may be rate limited. */
export type RateLimitFeature = string;

/** Application-defined facts used only to select configured policies. */
export type RateLimitAttributes = Readonly<Record<string, string>>;

/** Identifies the caller whose operation usage is counted. */
export interface RateLimitSubject {
	/** Stable identifier for the caller. */
	readonly id: string;
	/** Optional isolation boundary such as a tenant, organization, or workspace. */
	readonly scope?: string;
	/** Application-defined values available to policy criteria. */
	readonly attributes?: RateLimitAttributes;
}

/** Defines a fixed-window limit selected by feature and optional generic criteria. */
export interface RateLimitPolicy {
	readonly feature: RateLimitFeature;
	readonly criteria?: RateLimitAttributes;
	readonly limit: number;
	readonly windowMs: number;
	readonly cost?: number;
}

/** Describes one operation attempt before its most-specific policy is resolved. */
export interface RateLimitRequest {
	readonly feature: RateLimitFeature;
	readonly subject: RateLimitSubject;
	readonly cost?: number;
	readonly now?: Date;
}

/** Backend-neutral result of consuming capacity for an operation. */
export interface RateLimitDecision {
	readonly allowed: boolean;
	readonly feature: RateLimitFeature;
	readonly limit: number | null;
	readonly remaining: number | null;
	readonly resetAt: Date | null;
	readonly retryAfterMs: number | null;
}

/** Fixed-window counter input implemented by a concrete service. */
export interface RateLimitCounterRequest {
	readonly key: string;
	readonly limit: number;
	readonly windowMs: number;
	readonly cost: number;
	readonly now: Date;
}

/** Fixed-window counter result returned by a concrete service. */
export interface RateLimitCounterDecision {
	readonly allowed: boolean;
	readonly remaining: number;
	readonly resetAt: Date;
}

/** Consumer-facing rate-limiting operations. */
export interface RateLimitingService {
	consume(request: RateLimitRequest): Promise<RateLimitDecision>;
}

/**
 * Universal lifecycle and policy implementation shared by concrete backends.
 *
 * Applications define all contextual behavior through policy `criteria` and
 * subject `attributes`. Concrete services implement only the atomic counter.
 *
 * @example
 * ```ts
 * const service = new ServiceRedisRateLimiting([
 *   { feature: 'document.create', criteria: { plan: 'trial' }, limit: 5, windowMs: 60_000 },
 * ]);
 * await service.startUp();
 * await service.consume({
 *   feature: 'document.create',
 *   subject: { id: 'user-123', attributes: { plan: 'trial' } },
 * });
 * ```
 */
export abstract class ServiceRateLimiting implements ServiceBase<RateLimitingService>, RateLimitingService {
	private readonly resolvePolicy: RateLimitPolicyResolver;
	private started = false;

	constructor(policies: readonly RateLimitPolicy[]) {
		this.resolvePolicy = createRateLimitPolicyResolver(policies);
	}

	public async startUp(): Promise<RateLimitingService> {
		if (this.started) return this;
		await this.onStartUp();
		this.started = true;
		return this;
	}

	public async shutDown(): Promise<void> {
		if (!this.started) return;
		this.started = false;
		await this.onShutDown();
	}

	public async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
		if (!this.started) {
			throw new Error(`${this.constructor.name} is not started`);
		}
		const policy = this.resolvePolicy(request.feature, request.subject);
		if (!policy) {
			return {
				allowed: true,
				feature: request.feature,
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
		const counterDecision = await this.consumeCounter({
			key: createRateLimitKey(request, windowStartMs),
			limit: policy.limit,
			windowMs: policy.windowMs,
			cost,
			now,
		});

		return {
			allowed: counterDecision.allowed,
			feature: request.feature,
			limit: policy.limit,
			remaining: counterDecision.remaining,
			resetAt: counterDecision.resetAt,
			retryAfterMs: counterDecision.allowed ? null : Math.max(0, counterDecision.resetAt.getTime() - now.getTime()),
		};
	}

	protected onStartUp(): Promise<void> {
		return Promise.resolve();
	}

	protected onShutDown(): Promise<void> {
		return Promise.resolve();
	}

	protected abstract consumeCounter(request: RateLimitCounterRequest): Promise<RateLimitCounterDecision>;
}

/** Builds an isolated fixed-window key without application-specific naming. */
export function createRateLimitKey(request: RateLimitRequest, windowStartMs: number): string {
	const scope = encodeURIComponent(request.subject.scope ?? 'global');
	const subjectId = encodeURIComponent(request.subject.id);
	const feature = encodeURIComponent(request.feature);
	return `rate-limit:${scope}:${subjectId}:${feature}:${windowStartMs}`;
}

function matchesCriteria(criteria: RateLimitAttributes | undefined, attributes: RateLimitAttributes | undefined): boolean {
	return Object.entries(criteria ?? {}).every(([name, value]) => attributes?.[name] === value);
}

type RateLimitPolicyResolver = (feature: RateLimitFeature, subject: RateLimitSubject) => RateLimitPolicy | undefined;

function createRateLimitPolicyResolver(policies: readonly RateLimitPolicy[]): RateLimitPolicyResolver {
	const selectors = new Set<string>();
	for (const policy of policies) {
		if (policy.feature.trim().length === 0) throw new RangeError('Rate-limit policy feature must not be empty');
		if (!Number.isInteger(policy.limit) || policy.limit < 1) throw new RangeError('Rate-limit policy limit must be a positive integer');
		if (!Number.isInteger(policy.windowMs) || policy.windowMs < 1_000) throw new RangeError('Rate-limit policy windowMs must be at least 1,000 milliseconds');
		if (policy.cost !== undefined && (!Number.isInteger(policy.cost) || policy.cost < 1 || policy.cost > policy.limit)) {
			throw new RangeError(`Rate-limit policy cost must be an integer between 1 and ${policy.limit}`);
		}
		for (const [name, value] of Object.entries(policy.criteria ?? {})) {
			if (name.trim().length === 0 || value.trim().length === 0) throw new RangeError('Rate-limit policy criteria names and values must not be empty');
		}
		const criteria = Object.entries(policy.criteria ?? {}).sort(([left], [right]) => left.localeCompare(right));
		const selector = JSON.stringify([policy.feature, criteria]);
		if (selectors.has(selector)) throw new RangeError(`Duplicate rate-limit policy selector for feature ${policy.feature}`);
		selectors.add(selector);
	}

	return (feature, subject) => {
		let match: RateLimitPolicy | undefined;
		let specificity = -1;
		for (const policy of policies) {
			if (policy.feature !== feature || !matchesCriteria(policy.criteria, subject.attributes)) continue;
			const candidateSpecificity = Object.keys(policy.criteria ?? {}).length;
			if (candidateSpecificity === specificity) throw new RangeError(`Ambiguous rate-limit policies for feature ${feature}`);
			if (candidateSpecificity > specificity) {
				match = policy;
				specificity = candidateSpecificity;
			}
		}
		return match;
	};
}
