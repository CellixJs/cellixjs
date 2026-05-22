import type { QueueMessage } from './interfaces.js';
import type { IQueueMessageLogger, MessageLogEnvelope } from './logging.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';

/**
 * Move a single received message to a poison queue.
 * Order of operations:
 *  1) (optional) persist a message log via provided logger
 *  2) send the preserved envelope to the poison queue
 *  3) delete the original message from the source queue
 *
 * If sending to poison fails, the original message is NOT deleted so it can be retried.
 */
export async function moveMessageToPoison<T>(
	service: ServiceQueueStorage,
	sourceQueue: string,
	message: QueueMessage<T>,
	opts?: { poisonQueueName?: string; logger?: IQueueMessageLogger | undefined; awaitLogging?: boolean | undefined },
): Promise<void> {
	const poisonName = opts?.poisonQueueName ?? `${sourceQueue}-poison`;

	const envelope: MessageLogEnvelope = {
		queue: sourceQueue,
		messageId: message.id ?? '',
		payload: message.payload,
		metadata: { dequeueCount: message.dequeueCount ?? 0 },
		createdAt: new Date().toISOString(),
	};

	// 1) log if logger provided
	if (opts?.logger) {
		const doLog = async () => {
			try {
				await opts.logger?.logMessage(envelope);
			} catch (e) {
				console.error('[moveMessageToPoison] logging failed', e);
			}
		};
		if (opts.awaitLogging) await doLog();
		else void doLog();
	}

	// 2) send to poison queue (preserve full envelope)
	try {
		await service.sendMessage(poisonName, envelope);
	} catch (e) {
		console.error('[moveMessageToPoison] send to poison failed', e);
		throw e; // let caller decide
	}

	// 3) delete original message (best-effort only after successful send)
	if (message.popReceipt && message.id) {
		try {
			await service.deleteMessage(sourceQueue, message.id, message.popReceipt);
		} catch (e) {
			console.error('[moveMessageToPoison] failed to delete original message', e);
		}
	}
}
