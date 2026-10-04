import { afterEach, describe, expect, it, vi } from 'vitest';
import { consoleLogger, describeError } from './log.ts';

describe('consoleLogger', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('writes info entries as one JSON line to stdout', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

		consoleLogger.info('encode.started', { videoId: 'v1' });

		expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({ level: 'info', event: 'encode.started', videoId: 'v1', time: expect.any(String) });
	});

	it('writes error entries as one JSON line to stderr', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		consoleLogger.error('queue.message', { status: 'lost' });

		expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({ level: 'error', event: 'queue.message', status: 'lost' });
	});
});

describe('describeError', () => {
	it('keeps name, message, and code from errors', () => {
		expect(describeError(Object.assign(new TypeError('bad'), { code: 'E1' }))).toEqual({ name: 'TypeError', message: 'bad', code: 'E1' });
	});

	it('stringifies non-error values', () => {
		expect(describeError('plain failure')).toEqual({ message: 'plain failure' });
	});
});
