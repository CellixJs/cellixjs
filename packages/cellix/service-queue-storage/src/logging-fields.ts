import type { AnyLoggingFieldSpec, PayloadFieldProxy } from './interfaces.ts';

/**
 * Builds a proxy that produces a `{ payloadField: '<dotted path>' }` reference on
 * every property access, and recurses into further property accesses so that
 * nested payload fields (e.g. `$payload.eventPayload.communityId`) build up a
 * dotted path instead of losing the parent key.
 */
function createPayloadFieldProxy(path: string): unknown {
	return new Proxy(
		{ payloadField: path },
		{
			get(target, prop) {
				if (typeof prop === 'symbol') return Reflect.get(target, prop);
				if (prop === 'payloadField') return target.payloadField;
				return createPayloadFieldProxy(`${path}.${prop}`);
			},
		},
	);
}

const payloadFieldProxy = new Proxy(
	{},
	{
		get(target, prop) {
			if (typeof prop === 'symbol') return Reflect.get(target, prop);
			return createPayloadFieldProxy(prop);
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
 * field names here, and nested chaining (e.g. `$payload.eventPayload.communityId`)
 * is not type-checked for this export. Prefer `defineQueue<TPayload>()` or
 * `payloadFields<TPayload>()` when you want payload-key validation during authoring,
 * including for nested object fields.
 */
export const $payload = payloadFieldProxy as PayloadFieldProxy<Record<string, unknown>>;

/**
 * Creates a payload field proxy scoped to a specific payload type.
 *
 * This preserves the ergonomic `$payload.fieldName` syntax while letting TypeScript
 * reject field names that do not exist on the queue payload. Nested plain-object
 * fields can be chained (e.g. `$payload.eventPayload.communityId`) and still reject
 * unknown nested field names.
 *
 * @typeParam TPayload - Queue payload type whose (possibly nested) keys should be exposed on `$payload`.
 * @returns A proxy whose property names mirror the keys of `TPayload`, recursively.
 *
 * @example
 * ```ts
 * interface MemberUpdatedPayload {
 *   memberId: string;
 *   email?: string;
 *   eventPayload: { communityId: string };
 * }
 *
 * const $payload = payloadFields<MemberUpdatedPayload>();
 * const metadata = {
 *   memberId: $payload.memberId,
 *   email: $payload.email,
 *   communityId: $payload.eventPayload.communityId,
 * };
 * ```
 */
export function payloadFields<TPayload extends object>(): PayloadFieldProxy<TPayload> {
	return payloadFieldProxy as PayloadFieldProxy<TPayload>;
}

/** Reads a (possibly dotted) path off a runtime payload, returning `undefined` if any segment is missing. */
function readPayloadPath(payload: unknown, dottedPath: string): unknown {
	let current = payload;
	for (const segment of dottedPath.split('.')) {
		if (current === null || current === undefined) return undefined;
		current = (current as Record<string, unknown>)[segment];
	}
	return current;
}

/**
 * Resolves a map of payload-derived logging fields against a message payload.
 *
 * Hardcoded strings are copied as-is. Payload references — including nested
 * dotted-path references such as `eventPayload.communityId` — are omitted when
 * the referenced payload value is `undefined` or `null`, or when any segment
 * along the path is missing.
 *
 * @param specs - Logging field definitions using either hardcoded strings or payload references.
 * @param payload - Runtime queue payload to resolve against.
 * @returns A plain string map suitable for blob tags or metadata, or `undefined`
 * when no fields resolve to concrete values.
 *
 * @example
 * ```ts
 * const tags = resolveLoggingFields(
 *   { domain: 'community', communityId: { payloadField: 'eventPayload.communityId' } },
 *   { eventPayload: { communityId: 'community-123' } },
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
			const val = readPayloadPath(payload, spec.payloadField);
			if (val !== undefined && val !== null) {
				resolved[key] = String(val);
			}
		}
	}
	return Object.keys(resolved).length > 0 ? resolved : undefined;
}
