import { readWorkerConfig } from './config.ts';
import { createEncodeVideoHandler, isPermanentEncodingFailure } from './encode-video-handler.ts';
import { consoleLogger, describeError } from './log.ts';
import { runWorker } from './run-worker.ts';
import { startWorkerServices } from './services.ts';

const logger = consoleLogger;
const shutdown = new AbortController();
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	process.once(signal, () => {
		logger.info('worker.stopping', { signal });
		shutdown.abort(new Error(`Received ${signal}`));
	});
}

try {
	const config = readWorkerConfig();
	logger.info('worker.starting', { mode: config.mode, accountName: config.storage.accountName, local: config.storage.connectionString !== undefined });
	const services = await startWorkerServices(config);
	try {
		process.exitCode = await runWorker({
			queue: services.queue,
			handler: createEncodeVideoHandler(services.encoder, logger),
			isPermanentFailure: isPermanentEncodingFailure,
			mode: config.mode,
			visibilityTimeoutSeconds: config.queue.visibilityTimeoutSeconds,
			maxDequeueCount: config.queue.maxDequeueCount,
			pollIntervalSeconds: config.pollIntervalSeconds,
			signal: shutdown.signal,
			logger,
		});
	} finally {
		await services.shutDown();
	}
	logger.info('worker.stopped', { exitCode: process.exitCode });
} catch (error) {
	logger.error('worker.failed', { error: describeError(error) });
	process.exitCode = 1;
}
