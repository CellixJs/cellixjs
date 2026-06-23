import type { AnyLoggingFieldSpec, PayloadFieldProxy } from './interfaces.ts';

const payloadFieldProxy = new Proxy(
	{},
	{
		get(_target, prop: string) {
			return { payloadField: prop };
		},
	},
);

/**
 * Broad payload field proxy for simple use cases.
 *
 * For queue-specific key safety, prefer {@link payloadFields} or {@link defineQueue}
 * so TypeScript can restrict `$payload.<field>` to the actual payload keys.
 *
 * @example
 * ```ts
 * import { $payload } from '@cellix/service-queue-storage';
 *
 * const tags = {
 *   externalId: $payload.externalId,
 * };
 * ```
 *
 * @remarks
 * Because this export is intentionally broad, TypeScript cannot prevent typos in
 * field names here. Prefer `defineQueue<TPayload>()` or `payloadFields<TPayload>()`
 * when you want payload-key validation during authoring.
 */
export const $payload = payloadFieldProxy as PayloadFieldProxy<Record<string, unknown>>;

/**
 * Creates a payload field proxy scoped to a specific payload type.
 *
 * This preserves the ergonomic `$payload.fieldName` syntax while letting TypeScript
 * reject field names that do not exist on the queue payload.
 *
 * @typeParam TPayload - Queue payload type whose keys should be exposed on `$payload`.
 * @returns A proxy whose property names mirror the keys of `TPayload`.
 *
 * @example
 * ```ts
 * interface MemberUpdatedPayload {
 *   memberId: string;
 *   email?: string;
 * }
 *
 * const $payload = payloadFields<MemberUpdatedPayload>();
 * const metadata = { memberId: $payload.memberId, email: $payload.email };
 * ```
 */
export function payloadFields<TPayload extends object>(): PayloadFieldProxy<TPayload> {
	return payloadFieldProxy as PayloadFieldProxy<TPayload>;
}

/**
 * Resolves a map of payload-derived logging fields against a message payload.
 *
 * Hardcoded strings are copied as-is. Payload references are omitted when the
 * referenced payload value is `undefined` or `null`.
 *
 * @param specs - Logging field definitions using either hardcoded strings or payload references.
 * @param payload - Runtime queue payload to resolve against.
 * @returns A plain string map suitable for blob tags or metadata, or `undefined`
 * when no fields resolve to concrete values.
 *
 * @example
 * ```ts
 * const tags = resolveLoggingFields(
 *   { domain: 'community', communityId: { payloadField: 'communityId' } },
 *   { communityId: 'community-123' },
 * );
 *
 * // => { domain: 'community', communityId: 'community-123' }
 * ```
 */
export function resolveLoggingFields(specs: Record<string, AnyLoggingFieldSpec> | undefined, payload: unknown): Record<string, string> | undefined {
	if (!specs) return undefined;
	const resolved: Record<string, string> = {};
	for (const [key, spec] of Object.entries(specs)) {
		if (typeof spec === 'string') {
			resolved[key] = spec;
		} else {
			const val = (payload as Record<string, unknown>)?.[spec.payloadField];
			if (val !== undefined && val !== null) {
				resolved[key] = String(val);
			}
		}
	}
	return Object.keys(resolved).length > 0 ? resolved : undefined;
}
