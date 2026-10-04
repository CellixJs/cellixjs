import type { ProcessQueueMessageResult } from '@ocom/service-queue-storage';
import type { EncodeVideoMessageHandler } from './encode-video-handler.ts';
import { describeError, type WorkerLogger } from './log.ts';

interface EncodeVideoQueue {
	processNextFromEncodeVideoQueue(
		handler: EncodeVideoMessageHandler,
		options: {
			visibilityTimeoutSeconds: number;
			maxDequeueCount: number;
			isPermanentFailure: (error: unknown) => boolean;
			signal: AbortSignal;
		},
	): Promise<ProcessQueueMessageResult>;
}

export interface RunWorkerOptions {
	queue: EncodeVideoQueue;
	handler: EncodeVideoMessageHandler;
	isPermanentFailure: (error: unknown) => boolean;
	mode: 'once' | 'loop';
	visibilityTimeoutSeconds: number;
	maxDequeueCount: number;
	pollIntervalSeconds: number;
	signal: AbortSignal;
	logger: WorkerLogger;
}

/**
 * Processes `encode-video` messages.
 *
 * In `once` mode it processes at most one message and resolves to a process
 * exit code: 1 when the message is left for retry or lost, so the job
 * execution shows as failed, and 0 otherwise. In `loop` mode it processes
 * messages until `signal` aborts, sleeping `pollIntervalSeconds` whenever the
 * queue is empty or a receive fails, and resolves to 0.
 */
export async function runWorker(options: RunWorkerOptions): Promise<number> {
	const { queue, handler, isPermanentFailure, mode, signal, logger } = options;
	const processOptions = {
		visibilityTimeoutSeconds: options.visibilityTimeoutSeconds,
		maxDequeueCount: options.maxDequeueCount,
		isPermanentFailure,
		signal,
	};

	if (mode === 'once') {
		const result = await queue.processNextFromEncodeVideoQueue(handler, processOptions);
		if (result.status === 'empty') {
			logger.info('queue.empty');
		}
		logResult(logger, result);
		return result.status === 'retrying' || result.status === 'lost' ? 1 : 0;
	}

	while (!signal.aborted) {
		let processed = false;
		try {
			const result = await queue.processNextFromEncodeVideoQueue(handler, processOptions);
			logResult(logger, result);
			processed = result.status !== 'empty';
		} catch (error) {
			logger.error('queue.receive-failed', { error: describeError(error) });
		}
		if (!processed) {
			await sleep(options.pollIntervalSeconds * 1000, signal);
		}
	}
	return 0;
}

/** Logs a processed message. Empty polls are not logged here, so loop mode stays quiet while idle. */
function logResult(logger: WorkerLogger, result: ProcessQueueMessageResult): void {
	if (result.status === 'empty') {
		return;
	}
	const { status, messageId } = result;
	if (status === 'completed') {
		logger.info('queue.message', { status, messageId });
		return;
	}
	const reason = status === 'poisoned' ? { reason: result.reason } : {};
	const error = 'error' in result ? { error: describeError(result.error) } : {};
	logger.error('queue.message', { status, messageId, ...reason, ...error });
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		if (signal.aborted) {
			resolve();
			return;
		}
		const timer = setTimeout(done, ms);
		signal.addEventListener('abort', done, { once: true });
		function done() {
			clearTimeout(timer);
			signal.removeEventListener('abort', done);
			resolve();
		}
	});
}
