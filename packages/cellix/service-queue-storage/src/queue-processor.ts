import { diag } from '@opentelemetry/api';
import type { QueueMessage, QueueTriggerMetadata } from './interfaces.ts';
import type { InternalQueueTransport } from './internal-queue-storage-service.ts';

const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 300;
const DEFAULT_MAX_DEQUEUE_COUNT = 5;

/**
 * Handler invoked by `processNextFrom...Queue` with one validated message.
 *
 * Resolve to mark the message as processed, which deletes it from the queue.
 * Reject to report a failure, which either retries or poisons the message
 * depending on {@link ProcessQueueMessageOptions.isPermanentFailure}.
 *
 * @param message - The validated, typed message, including its dequeue count.
 * @param context - `signal` aborts when the caller's signal aborts or when the
 * message's visibility can no longer be renewed. Long-running handlers should
 * stop work promptly when it fires.
 */
export type QueueMessageHandler<TPayload> = (message: QueueMessage<TPayload>, context: { signal: AbortSignal }) => Promise<void>;

/**
 * Options for processing one message with `processNextFrom...Queue`.
 *
 * @property visibilityTimeoutSeconds - How long the message stays hidden from
 * other receivers after each receive or renewal. Defaults to 300. A crashed
 * process releases the message after at most this long.
 * @property heartbeatIntervalSeconds - How often visibility is renewed while
 * the handler runs. Must be shorter than `visibilityTimeoutSeconds`. Defaults
 * to a third of it.
 * @property maxDequeueCount - Deliveries allowed before a message is moved to
 * the poison queue without running the handler. Defaults to 5, matching the
 * Azure Functions queue trigger.
 * @property poisonQueueName - Queue that receives poisoned messages. Defaults
 * to `<queueName>-poison`. It is created on first use if it does not exist.
 * @property retryDelaySeconds - How long a message stays hidden after a
 * transient failure before it can be retried. Defaults to 0.
 * @property isPermanentFailure - Classifies handler errors. Return `true` to
 * poison the message instead of retrying it. By default every handler error is
 * treated as transient.
 * @property signal - Aborts the handler and releases the message for
 * immediate retry, for example on process shutdown.
 */
export interface ProcessQueueMessageOptions {
	visibilityTimeoutSeconds?: number;
	heartbeatIntervalSeconds?: number;
	maxDequeueCount?: number;
	poisonQueueName?: string;
	retryDelaySeconds?: number;
	isPermanentFailure?: (error: unknown) => boolean;
	signal?: AbortSignal;
}

/**
 * Outcome of `processNextFrom...Queue`.
 *
 * - `empty`: no message was visible.
 * - `completed`: the handler resolved and the message was deleted.
 * - `retrying`: the handler failed transiently or was aborted by the caller,
 *   and the message was left on the queue.
 * - `poisoned`: the message was moved to the poison queue because its payload
 *   was invalid, the handler failed permanently, or it exceeded
 *   `maxDequeueCount`.
 * - `lost`: visibility could not be renewed, or the message could not be
 *   deleted, usually because the lease expired and another receiver took the
 *   message. The handler's signal was aborted. Handlers should be idempotent,
 *   because the message may be processed again.
 */
export type ProcessQueueMessageResult =
	| { status: 'empty' }
	| { status: 'completed'; messageId: string }
	| { status: 'retrying'; messageId: string; error: unknown }
	| { status: 'poisoned'; messageId: string; reason: 'invalid-payload' | 'permanent-failure'; error: unknown }
	| { status: 'poisoned'; messageId: string; reason: 'max-dequeue-count' }
	| { status: 'lost'; messageId: string; error: unknown };

type ProcessorTransport = Pick<InternalQueueTransport, 'receiveMessages' | 'deleteMessage' | 'sendMessage' | 'createQueueIfNotExists' | 'updateMessageVisibility'>;

/**
 * Receives and processes one message: validates and logs it through
 * `receive`, keeps it hidden with a heartbeat while `handler` runs, then
 * deletes, retries, or poisons it.
 */
export async function processNextMessage<TPayload>(
	transport: ProcessorTransport,
	queueName: string,
	receive: (payload: unknown, metadata: QueueTriggerMetadata) => Promise<QueueMessage<TPayload>>,
	handler: QueueMessageHandler<TPayload>,
	options: ProcessQueueMessageOptions = {},
): Promise<ProcessQueueMessageResult> {
	const visibility = options.visibilityTimeoutSeconds ?? DEFAULT_VISIBILITY_TIMEOUT_SECONDS;
	const heartbeat = options.heartbeatIntervalSeconds ?? Math.max(1, Math.floor(visibility / 3));
	if (heartbeat >= visibility) {
		throw new Error(`heartbeatIntervalSeconds (${heartbeat}) must be shorter than visibilityTimeoutSeconds (${visibility})`);
	}
	const maxDequeueCount = options.maxDequeueCount ?? DEFAULT_MAX_DEQUEUE_COUNT;
	const poisonQueueName = options.poisonQueueName ?? `${queueName}-poison`;

	const [received] = await transport.receiveMessages(queueName, { maxMessages: 1, visibilityTimeout: visibility });
	if (!received) {
		return { status: 'empty' };
	}

	const messageId = received.id;
	const lease = { popReceipt: received.popReceipt ?? '' };

	const poison = async () => {
		await transport.createQueueIfNotExists(poisonQueueName);
		await transport.sendMessage(poisonQueueName, received.payload as string | object);
		await transport.deleteMessage(queueName, messageId, lease.popReceipt);
	};

	const release = async (delaySeconds: number) => {
		try {
			lease.popReceipt = await transport.updateMessageVisibility(queueName, messageId, lease.popReceipt, delaySeconds);
		} catch (error) {
			diag.warn('[QueueProcessor] could not release message; it becomes visible when its lease expires', { queueName, messageId, error });
		}
	};

	if ((received.dequeueCount ?? 1) > maxDequeueCount) {
		await poison();
		return { status: 'poisoned', messageId, reason: 'max-dequeue-count' };
	}

	let message: QueueMessage<TPayload>;
	try {
		message = await receive(received.payload, { id: messageId, popReceipt: lease.popReceipt, ...(received.dequeueCount === undefined ? {} : { dequeueCount: received.dequeueCount }) });
	} catch (error) {
		await poison();
		return { status: 'poisoned', messageId, reason: 'invalid-payload', error };
	}

	const controller = new AbortController();
	const forwardAbort = () => controller.abort(options.signal?.reason);
	if (options.signal?.aborted) {
		forwardAbort();
	}
	options.signal?.addEventListener('abort', forwardAbort, { once: true });

	let lostError: { error: unknown } | undefined;
	let renewals = Promise.resolve();
	const timer = setInterval(() => {
		renewals = renewals.then(async () => {
			if (lostError) {
				return;
			}
			try {
				lease.popReceipt = await transport.updateMessageVisibility(queueName, messageId, lease.popReceipt, visibility);
			} catch (error) {
				lostError = { error };
				controller.abort(error);
			}
		});
	}, heartbeat * 1000);

	let failure: { error: unknown } | undefined;
	try {
		await handler(message, { signal: controller.signal });
	} catch (error) {
		failure = { error };
	} finally {
		clearInterval(timer);
		options.signal?.removeEventListener('abort', forwardAbort);
		await renewals;
	}

	if (lostError) {
		return { status: 'lost', messageId, error: lostError.error };
	}

	if (!failure) {
		try {
			await transport.deleteMessage(queueName, messageId, lease.popReceipt);
		} catch (error) {
			return { status: 'lost', messageId, error };
		}
		return { status: 'completed', messageId };
	}

	if (options.signal?.aborted) {
		await release(0);
		return { status: 'retrying', messageId, error: failure.error };
	}

	if (options.isPermanentFailure?.(failure.error)) {
		await poison();
		return { status: 'poisoned', messageId, reason: 'permanent-failure', error: failure.error };
	}

	await release(options.retryDelaySeconds ?? 0);
	return { status: 'retrying', messageId, error: failure.error };
}
