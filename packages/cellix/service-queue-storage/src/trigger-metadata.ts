import type { QueueTriggerMetadata } from './interfaces.ts';

/**
 * Builds a {@link QueueTriggerMetadata} object from an Azure Functions storage queue trigger's
 * `triggerMetadata` bag.
 *
 * @remarks
 * Azure Functions types `InvocationContext.triggerMetadata` as an index-signature record, so callers
 * would otherwise need to repeat the same bracket-access extraction (and `exactOptionalPropertyTypes`-safe
 * optional key omission) in every queue handler. Centralizing it here keeps that behavior consistent
 * across handlers.
 *
 * @param triggerMetadata - The raw `context.triggerMetadata` value from an Azure Functions storage queue trigger invocation.
 * @returns Trigger metadata with `id` defaulted to `''` when absent, and `popReceipt`/`dequeueCount` omitted (rather than set to `undefined`) when not present.
 *
 * @example
 * ```ts
 * const metadata = extractQueueTriggerMetadata(context.triggerMetadata);
 * await queueService.receiveFromCommunityUpdateQueue(queueEntry, metadata);
 * ```
 */
export function extractQueueTriggerMetadata(triggerMetadata: Record<string, unknown> | undefined): QueueTriggerMetadata {
	// biome-ignore lint/complexity/useLiteralKeys: triggerMetadata uses an index signature type that requires bracket access
	const id = (triggerMetadata?.['id'] as string) ?? '';
	// biome-ignore lint/complexity/useLiteralKeys: triggerMetadata uses an index signature type that requires bracket access
	const popReceipt = triggerMetadata?.['popReceipt'] as string | undefined;
	// biome-ignore lint/complexity/useLiteralKeys: triggerMetadata uses an index signature type that requires bracket access
	const dequeueCount = triggerMetadata?.['dequeueCount'] as number | undefined;
	// exactOptionalPropertyTypes: omit keys whose values are undefined rather than passing explicit undefined
	return {
		id,
		...(popReceipt === undefined ? {} : { popReceipt }),
		...(dequeueCount === undefined ? {} : { dequeueCount }),
	};
}
