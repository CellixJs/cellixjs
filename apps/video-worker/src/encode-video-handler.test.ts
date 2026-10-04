import { VideoEncodingError } from '@ocom/service-video-encoding';
import { describe, expect, it, vi } from 'vitest';
import { createEncodeVideoHandler, isPermanentEncodingFailure } from './encode-video-handler.ts';

const payload = {
	videoId: 'video-123',
	source: { containerName: 'uploads', blobName: 'raw/video-123.mov' },
	destination: { containerName: 'videos', prefix: 'video-123/' },
};

const result = {
	manifests: { dash: { containerName: 'videos', blobName: 'video-123/manifest.mpd' }, hls: { containerName: 'videos', blobName: 'video-123/master.m3u8' } },
	durationSeconds: 900,
	renditions: [{ width: 1920, height: 1080, videoBitrateKbps: 5000 }],
	hasAudio: true,
	textTracks: [],
};

function createLogger() {
	return { info: vi.fn(), error: vi.fn() };
}

describe('createEncodeVideoHandler', () => {
	it('encodes the payload source into its destination with the message signal', async () => {
		const encode = vi.fn().mockResolvedValue(result);
		const signal = new AbortController().signal;

		await createEncodeVideoHandler({ encode }, createLogger())({ id: 'm1', payload, dequeueCount: 1 }, { signal });

		expect(encode).toHaveBeenCalledWith({ source: payload.source, destination: payload.destination }, expect.objectContaining({ signal }));
	});

	it('logs start, each stage once, and the completed result keyed by videoId', async () => {
		const logger = createLogger();
		const encode = vi.fn(async (_request, options: { onProgress: (progress: { stage: string; percent: number }) => void }) => {
			await Promise.resolve();
			options.onProgress({ stage: 'downloading', percent: 0 });
			options.onProgress({ stage: 'downloading', percent: 100 });
			options.onProgress({ stage: 'encoding', percent: 0 });
			options.onProgress({ stage: 'encoding', percent: 50 });
			return result;
		});

		await createEncodeVideoHandler({ encode }, logger)({ id: 'm1', payload, dequeueCount: 2 }, { signal: new AbortController().signal });

		expect(logger.info.mock.calls.map(([event, fields]) => [event, (fields as { stage?: string }).stage])).toEqual([
			['encode.started', undefined],
			['encode.stage', 'downloading'],
			['encode.stage', 'encoding'],
			['encode.completed', undefined],
		]);
		expect(logger.info).toHaveBeenCalledWith('encode.started', expect.objectContaining({ videoId: 'video-123', messageId: 'm1', dequeueCount: 2 }));
		expect(logger.info).toHaveBeenCalledWith('encode.completed', expect.objectContaining({ videoId: 'video-123', manifests: result.manifests, durationSeconds: 900 }));
	});

	it('rethrows encoding failures for the queue processor to classify', async () => {
		const failure = new VideoEncodingError('storage-failed', 'upload failed');
		const handler = createEncodeVideoHandler({ encode: vi.fn().mockRejectedValue(failure) }, createLogger());

		await expect(handler({ id: 'm1', payload }, { signal: new AbortController().signal })).rejects.toBe(failure);
	});
});

describe('isPermanentEncodingFailure', () => {
	it.each(['source-not-found', 'unsupported-source'] as const)('treats %s as permanent', (code) => {
		expect(isPermanentEncodingFailure(new VideoEncodingError(code, 'x'))).toBe(true);
	});

	it.each(['tool-unavailable', 'encode-failed', 'packaging-failed', 'storage-failed', 'aborted'] as const)('treats %s as transient', (code) => {
		expect(isPermanentEncodingFailure(new VideoEncodingError(code, 'x'))).toBe(false);
	});

	it('treats errors that are not VideoEncodingError as transient', () => {
		expect(isPermanentEncodingFailure(Object.assign(new Error('x'), { code: 'source-not-found' }))).toBe(false);
	});
});
