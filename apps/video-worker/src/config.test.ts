import { describe, expect, it } from 'vitest';
import { readWorkerConfig } from './config.ts';

describe('readWorkerConfig', () => {
	const base = { AZURE_STORAGE_ACCOUNT_NAME: 'ocmdevstapp' };

	it('defaults to once mode, managed identity, and standard queue settings', () => {
		expect(readWorkerConfig(base)).toEqual({
			mode: 'once',
			storage: { accountName: 'ocmdevstapp', connectionString: undefined },
			encoder: { ffmpegPath: undefined, ffprobePath: undefined, packagerPath: undefined, workingDirectory: undefined },
			queue: { visibilityTimeoutSeconds: 300, maxDequeueCount: 5 },
			pollIntervalSeconds: 5,
		});
	});

	it('reads every override', () => {
		const config = readWorkerConfig({
			...base,
			WORKER_MODE: 'loop',
			AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true',
			FFMPEG_PATH: '/usr/bin/ffmpeg',
			FFPROBE_PATH: '/usr/bin/ffprobe',
			PACKAGER_PATH: '/usr/local/bin/packager',
			ENCODING_WORKING_DIRECTORY: '/mnt/scratch',
			QUEUE_VISIBILITY_TIMEOUT_SECONDS: '600',
			QUEUE_MAX_DEQUEUE_COUNT: '3',
			QUEUE_POLL_INTERVAL_SECONDS: '10',
		});

		expect(config).toEqual({
			mode: 'loop',
			storage: { accountName: 'ocmdevstapp', connectionString: 'UseDevelopmentStorage=true' },
			encoder: { ffmpegPath: '/usr/bin/ffmpeg', ffprobePath: '/usr/bin/ffprobe', packagerPath: '/usr/local/bin/packager', workingDirectory: '/mnt/scratch' },
			queue: { visibilityTimeoutSeconds: 600, maxDequeueCount: 3 },
			pollIntervalSeconds: 10,
		});
	});

	it('treats a blank connection string as absent', () => {
		expect(readWorkerConfig({ ...base, AZURE_STORAGE_CONNECTION_STRING: '  ' }).storage.connectionString).toBeUndefined();
	});

	it('requires the storage account name', () => {
		expect(() => readWorkerConfig({})).toThrow('AZURE_STORAGE_ACCOUNT_NAME is required');
	});

	it('rejects an unknown mode', () => {
		expect(() => readWorkerConfig({ ...base, WORKER_MODE: 'forever' })).toThrow("WORKER_MODE must be 'once' or 'loop'");
	});

	it.each(['0', '-1', '1.5', 'ten'])('rejects a non-positive-integer setting (%s)', (value) => {
		expect(() => readWorkerConfig({ ...base, QUEUE_VISIBILITY_TIMEOUT_SECONDS: value })).toThrow('QUEUE_VISIBILITY_TIMEOUT_SECONDS must be a positive integer');
	});
});
