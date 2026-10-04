import { afterEach, describe, expect, it, vi } from 'vitest';
import { type RunWorkerOptions, runWorker } from './run-worker.ts';

type Result = Awaited<ReturnType<RunWorkerOptions['queue']['processNextFromEncodeVideoQueue']>>;

function createOptions(results: (Result | Error)[], overrides: Partial<RunWorkerOptions> = {}) {
	const controller = new AbortController();
	const processNext = vi.fn(() => {
		const next = results.shift();
		if (next === undefined) {
			controller.abort();
			return Promise.resolve<Result>({ status: 'empty' });
		}
		return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
	});
	const logger = { info: vi.fn(), error: vi.fn() };
	const options: RunWorkerOptions = {
		queue: { processNextFromEncodeVideoQueue: processNext },
		handler: vi.fn(),
		isPermanentFailure: vi.fn(),
		mode: 'once',
		visibilityTimeoutSeconds: 600,
		maxDequeueCount: 4,
		pollIntervalSeconds: 5,
		signal: controller.signal,
		logger,
		...overrides,
	};
	return { options, processNext, logger, controller };
}

describe('runWorker', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	describe('once mode', () => {
		it('processes one message with the configured queue options', async () => {
			const { options, processNext } = createOptions([{ status: 'completed', messageId: 'm1' }]);

			await expect(runWorker(options)).resolves.toBe(0);

			expect(processNext).toHaveBeenCalledTimes(1);
			expect(processNext).toHaveBeenCalledWith(options.handler, {
				visibilityTimeoutSeconds: 600,
				maxDequeueCount: 4,
				isPermanentFailure: options.isPermanentFailure,
				signal: options.signal,
			});
		});

		it.each([
			[{ status: 'empty' } as Result, 0],
			[{ status: 'completed', messageId: 'm1' } as Result, 0],
			[{ status: 'poisoned', messageId: 'm1', reason: 'permanent-failure', error: new Error('missing') } as Result, 0],
			[{ status: 'retrying', messageId: 'm1', error: new Error('busy') } as Result, 1],
			[{ status: 'lost', messageId: 'm1', error: new Error('lease') } as Result, 1],
		])('exits with the right code for %o', async (result, exitCode) => {
			const { options } = createOptions([result]);

			await expect(runWorker(options)).resolves.toBe(exitCode);
		});

		it('logs failures with the reason and a serializable error', async () => {
			const { options, logger } = createOptions([{ status: 'poisoned', messageId: 'm1', reason: 'invalid-payload', error: Object.assign(new Error('bad'), { code: 'x' }) }]);

			await runWorker(options);

			expect(logger.error).toHaveBeenCalledWith('queue.message', {
				status: 'poisoned',
				messageId: 'm1',
				reason: 'invalid-payload',
				error: { name: 'Error', message: 'bad', code: 'x' },
			});
		});

		it('logs an empty queue', async () => {
			const { options, logger } = createOptions([{ status: 'empty' }]);

			await runWorker(options);

			expect(logger.info).toHaveBeenCalledWith('queue.empty');
		});

		it('propagates a receive failure', async () => {
			const { options } = createOptions([new Error('queue unreachable')]);

			await expect(runWorker(options)).rejects.toThrow('queue unreachable');
		});
	});

	describe('loop mode', () => {
		it('keeps processing until the signal aborts, sleeping only when the queue is empty', async () => {
			vi.useFakeTimers();
			const { options, processNext } = createOptions([{ status: 'completed', messageId: 'm1' }, { status: 'empty' }, { status: 'completed', messageId: 'm2' }], { mode: 'loop' });

			const running = runWorker(options);
			await vi.advanceTimersByTimeAsync(0);
			expect(processNext).toHaveBeenCalledTimes(2);
			await vi.advanceTimersByTimeAsync(5000);

			await expect(running).resolves.toBe(0);
			expect(processNext).toHaveBeenCalledTimes(4);
		});

		it('does not log empty polls', async () => {
			vi.useFakeTimers();
			const { options, logger } = createOptions([{ status: 'empty' }, { status: 'empty' }], { mode: 'loop' });

			const running = runWorker(options);
			await vi.advanceTimersByTimeAsync(10_000);

			await expect(running).resolves.toBe(0);
			expect(logger.info).not.toHaveBeenCalledWith('queue.empty');
		});

		it('logs receive failures and keeps running', async () => {
			vi.useFakeTimers();
			const { options, logger, processNext } = createOptions([new Error('queue unreachable'), { status: 'completed', messageId: 'm1' }], { mode: 'loop' });

			const running = runWorker(options);
			await vi.advanceTimersByTimeAsync(5000);

			await expect(running).resolves.toBe(0);
			expect(logger.error).toHaveBeenCalledWith('queue.receive-failed', { error: { name: 'Error', message: 'queue unreachable' } });
			expect(processNext).toHaveBeenCalledTimes(3);
		});

		it('stops sleeping as soon as the signal aborts', async () => {
			vi.useFakeTimers();
			const { options, controller } = createOptions([{ status: 'empty' }], { mode: 'loop', pollIntervalSeconds: 3600 });

			const running = runWorker(options);
			await vi.advanceTimersByTimeAsync(0);
			controller.abort();

			await expect(running).resolves.toBe(0);
		});
	});
});
