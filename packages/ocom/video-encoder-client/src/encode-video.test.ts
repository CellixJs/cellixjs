import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncoderApiClient } from './api-client.ts';

const { encode, shutDown, startUp } = vi.hoisted(() => ({ encode: vi.fn(), shutDown: vi.fn(), startUp: vi.fn() }));

vi.mock('@ocom/service-video-encoding', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@ocom/service-video-encoding')>();
	class FakeServiceVideoEncoding {
		public readonly options: unknown;
		constructor(options: unknown) {
			this.options = options;
		}
		startUp() {
			startUp(this.options);
			return Promise.resolve({ encode });
		}
		shutDown() {
			shutDown();
			return Promise.resolve();
		}
	}
	return { ...actual, ServiceVideoEncoding: FakeServiceVideoEncoding };
});

const { VideoEncodingError } = await import('@ocom/service-video-encoding');
const { encodeVideo } = await import('./encode-video.ts');

function makeApi() {
	return {
		startEncoding: vi.fn(() => Promise.resolve({ sourceUrl: 'https://s/src?sig', outputContainerName: 'videos-c1', outputPrefix: 'v1/' })),
		requestOutputUploads: vi.fn(),
		recordSucceeded: vi.fn(() => Promise.resolve()),
		recordFailed: vi.fn(() => Promise.resolve()),
	} as unknown as EncoderApiClient & Record<'startEncoding' | 'recordSucceeded' | 'recordFailed', ReturnType<typeof vi.fn>>;
}

describe('encodeVideo', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('starts, encodes into the API destination, and records the result with relative manifest paths', async () => {
		const api = makeApi();
		encode.mockResolvedValue({
			manifests: { dash: { containerName: 'videos-c1', blobName: 'v1/manifest.mpd' }, hls: { containerName: 'videos-c1', blobName: 'v1/master.m3u8' } },
			durationSeconds: 912.4,
			renditions: [
				{ width: 1080, height: 1920, videoBitrateKbps: 5000 },
				{ width: 720, height: 1280, videoBitrateKbps: 2800 },
			],
			hasAudio: true,
			textTracks: [],
		});

		await encodeVideo({ api, videoId: 'v1', tools: { ffmpegPath: '/opt/ffmpeg' } });

		expect(api.startEncoding).toHaveBeenCalledWith('v1');
		expect(startUp).toHaveBeenCalledWith(expect.objectContaining({ ffmpegPath: '/opt/ffmpeg' }));
		expect(encode).toHaveBeenCalledWith(expect.objectContaining({ destination: { containerName: 'videos-c1', prefix: 'v1/' } }), {});
		expect(api.recordSucceeded).toHaveBeenCalledWith('v1', { dashManifestPath: 'manifest.mpd', hlsManifestPath: 'master.m3u8', durationSeconds: 912.4, renditionHeights: [1080, 720] });
		expect(shutDown).toHaveBeenCalled();
	});

	it('records an encoding failure and rethrows it', async () => {
		const api = makeApi();
		const failure = new VideoEncodingError('unsupported-source', 'The source has no video stream');
		encode.mockRejectedValue(failure);

		await expect(encodeVideo({ api, videoId: 'v1' })).rejects.toBe(failure);
		expect(api.recordFailed).toHaveBeenCalledWith('v1', { code: 'unsupported-source', message: 'The source has no video stream' });
		expect(shutDown).toHaveBeenCalled();
	});

	it.each(['aborted', 'tool-unavailable'] as const)('leaves the video encoding when the failure is %s', async (code) => {
		const api = makeApi();
		encode.mockRejectedValue(new VideoEncodingError(code, 'stopped'));

		await expect(encodeVideo({ api, videoId: 'v1' })).rejects.toThrow('stopped');
		expect(api.recordFailed).not.toHaveBeenCalled();
	});

	it('does not start encoding when the tools are missing', async () => {
		const api = makeApi();
		startUp.mockImplementationOnce(() => {
			throw new VideoEncodingError('tool-unavailable', 'ffmpeg is not usable');
		});

		await expect(encodeVideo({ api, videoId: 'v1' })).rejects.toThrow('ffmpeg is not usable');
		expect(api.startEncoding).not.toHaveBeenCalled();
		expect(shutDown).toHaveBeenCalled();
	});

	it('routes blob transfers through the links issued when encoding starts', async () => {
		const api = makeApi();
		const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 404 })));
		encode.mockImplementation(async () => {
			const options = startUp.mock.calls[0]?.[0] as { blobStorage: { downloadToFile: (request: object) => Promise<void> } };
			await options.blobStorage.downloadToFile({ containerName: 'source', blobName: 'source', filePath: '/tmp/never-written' });
		});

		await expect(encodeVideo({ api, videoId: 'v1', fetch: fetchMock as unknown as typeof fetch })).rejects.toMatchObject({ statusCode: 404 });
		expect(fetchMock).toHaveBeenCalledWith('https://s/src?sig', {});
	});

	it('does not record errors that are not encoding errors', async () => {
		const api = makeApi();
		encode.mockRejectedValue(new Error('unexpected'));

		await expect(encodeVideo({ api, videoId: 'v1' })).rejects.toThrow('unexpected');
		expect(api.recordFailed).not.toHaveBeenCalled();
	});
});
