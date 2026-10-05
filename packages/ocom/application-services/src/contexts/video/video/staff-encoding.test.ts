import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { expect, vi } from 'vitest';
import { queryAwaitingEncoding } from './query-awaiting-encoding.ts';
import { recordEncodingResult } from './record-encoding-result.ts';
import { requestOutputUploads } from './request-output-uploads.ts';
import { startEncoding } from './start-encoding.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-encoding.feature'));

const sixHours = 6 * 60 * 60 * 1000;
const expectSixHours = (date: Date) => expect(Math.abs(date.getTime() - Date.now() - sixHours)).toBeLessThan(5000);

interface FakeVideo {
	id: string;
	community: { id: string };
	sourceContainerName: string;
	sourceBlobName: string;
	outputContainerName: string | null;
	outputPrefix: string | null;
	startEncoding: ReturnType<typeof vi.fn>;
	resolveOutputBlobNames: ReturnType<typeof vi.fn>;
	recordEncodingSucceeded: ReturnType<typeof vi.fn>;
	recordEncodingFailed: ReturnType<typeof vi.fn>;
}

function makeVideo(overrides: Partial<FakeVideo> = {}): FakeVideo {
	const video: FakeVideo = {
		id: 'video-1',
		community: { id: 'C0FFEE000000000000000001' },
		sourceContainerName: 'video-uploads',
		sourceBlobName: 'c1/original',
		outputContainerName: null,
		outputPrefix: null,
		startEncoding: vi.fn((destination: { containerName: string; prefix: string }) => {
			video.outputContainerName = destination.containerName;
			video.outputPrefix = destination.prefix;
		}),
		resolveOutputBlobNames: vi.fn((paths: string[]) => paths.map((p) => `video-1/${p}`)),
		recordEncodingSucceeded: vi.fn(),
		recordEncodingFailed: vi.fn(),
		...overrides,
	};
	return video;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let video: FakeVideo | FakeVideo[] | null;
	let save: ReturnType<typeof vi.fn>;
	let blobStorage: BlobStorageOperations;
	let clientOperations: ClientUploadOperations;
	let result: unknown;
	let caught: unknown;

	const dataSources = () =>
		({
			readonlyDataSource: { Video: { Video: { VideoReadRepo: { getById: vi.fn(async () => video), getByStatuses: vi.fn(async () => video) } } } },
			domainDataSource: { Video: { Video: { VideoUnitOfWork: { withScopedTransaction: vi.fn(async (fn: (repo: unknown) => Promise<void>) => fn({ getById: vi.fn(async () => video), save })) } } } },
		}) as unknown as DataSources;
	const attempt = async (action: () => Promise<unknown>) => {
		try {
			result = await action();
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		result = undefined;
		caught = undefined;
		save = vi.fn(async (saved: unknown) => saved);
		blobStorage = {
			createContainerIfNotExists: vi.fn(async () => undefined),
			getBlobUrl: vi.fn((address: { containerName: string; blobName: string }) => `https://storage.test/${address.containerName}/${address.blobName}`),
		} as unknown as BlobStorageOperations;
		clientOperations = {
			generateReadSasToken: vi.fn(async () => 'sp=r&sig=read'),
			generateWriteSasToken: vi.fn(async (request: { blobName: string }) => `sp=cw&sig=${request.blobName}`),
		} as unknown as ClientUploadOperations;
	});

	Scenario('Listing videos the caller can encode', ({ Given, When, Then }) => {
		Given('uploaded, encoding, and failed videos, only some of which the caller can encode', () => {
			video = [
				{ id: 'video-1', canEncode: () => true },
				{ id: 'video-2', canEncode: () => false },
				{ id: 'video-3', canEncode: () => true },
			] as unknown as FakeVideo[];
		});
		When('I query videos awaiting encoding', () => attempt(() => queryAwaitingEncoding(dataSources())()));
		Then("only the videos the caller can encode should be returned, in the repository's order", () => {
			expect((result as { id: string }[]).map((v) => v.id)).toEqual(['video-1', 'video-3']);
		});
	});

	Scenario('Starting to encode a video', ({ Given, When, Then, And }) => {
		Given('an uploaded video "video-1" in community "C0FFEE000000000000000001"', () => {
			video = makeVideo();
		});
		When('I start encoding "video-1"', () => attempt(() => startEncoding(dataSources(), blobStorage, clientOperations)({ videoId: 'video-1' })));
		Then('the video should start encoding into "videos-c0ffee000000000000000001" under "video-1/" and be saved', () => {
			expect((video as FakeVideo).startEncoding).toHaveBeenCalledWith({ containerName: 'videos-c0ffee000000000000000001', prefix: 'video-1/' });
			expect(save).toHaveBeenCalledWith(video);
		});
		And('the output container should be created if missing', () => {
			expect(blobStorage.createContainerIfNotExists).toHaveBeenCalledWith({ containerName: 'videos-c0ffee000000000000000001' });
		});
		And('I should receive a 6-hour read link for the original and the output destination', () => {
			const [request] = (clientOperations.generateReadSasToken as ReturnType<typeof vi.fn>).mock.calls[0] as [{ containerName: string; blobName: string; expiresOn: Date }];
			expect(request).toMatchObject({ containerName: 'video-uploads', blobName: 'c1/original' });
			expectSixHours(request.expiresOn);
			expect(result).toMatchObject({
				sourceUrl: 'https://storage.test/video-uploads/c1/original?sp=r&sig=read',
				outputContainerName: 'videos-c0ffee000000000000000001',
				outputPrefix: 'video-1/',
			});
		});
	});

	Scenario('Starting to encode when the domain refuses', ({ Given, When, Then, And }) => {
		Given('a video whose startEncoding fails with "You do not have permission to encode videos"', () => {
			video = makeVideo({
				startEncoding: vi.fn(() => {
					throw new Error('You do not have permission to encode videos');
				}),
			});
		});
		When('I try to start encoding "video-1"', () => attempt(() => startEncoding(dataSources(), blobStorage, clientOperations)({ videoId: 'video-1' })));
		Then('it should fail with "You do not have permission to encode videos"', () => {
			expect((caught as Error).message).toBe('You do not have permission to encode videos');
		});
		And('no read link should be issued', () => {
			expect(clientOperations.generateReadSasToken).not.toHaveBeenCalled();
		});
	});

	Scenario('Requesting upload links for encoded output', ({ Given, When, Then }) => {
		Given('an encoding video "video-1" whose output goes to "videos-c1" under "video-1/"', () => {
			video = makeVideo({ outputContainerName: 'videos-c1', outputPrefix: 'video-1/' });
		});
		When('I request upload links for "manifest.mpd" and "video/720/1.m4s"', () =>
			attempt(() => requestOutputUploads(dataSources(), blobStorage, clientOperations)({ videoId: 'video-1', paths: ['manifest.mpd', 'video/720/1.m4s'] })),
		);
		Then('I should receive one 6-hour write link per path, for the matching blob under "video-1/"', () => {
			expect(result).toEqual([
				{ path: 'manifest.mpd', url: 'https://storage.test/videos-c1/video-1/manifest.mpd?sp=cw&sig=video-1/manifest.mpd' },
				{ path: 'video/720/1.m4s', url: 'https://storage.test/videos-c1/video-1/video/720/1.m4s?sp=cw&sig=video-1/video/720/1.m4s' },
			]);
			const [request] = (clientOperations.generateWriteSasToken as ReturnType<typeof vi.fn>).mock.calls[0] as [{ containerName: string; expiresOn: Date }];
			expect(request.containerName).toBe('videos-c1');
			expectSixHours(request.expiresOn);
		});
	});

	Scenario('Requesting upload links for a video that does not exist', ({ Given, When, Then }) => {
		Given('no video exists', () => {
			video = null;
		});
		When('I try to request upload links for "manifest.mpd"', () => attempt(() => requestOutputUploads(dataSources(), blobStorage, clientOperations)({ videoId: 'video-1', paths: ['manifest.mpd'] })));
		Then('it should fail with "Video not found"', () => {
			expect((caught as Error).message).toBe('Video not found');
		});
	});

	Scenario('Recording a successful encode', ({ Given, When, Then }) => {
		Given('an encoding video "video-1" whose output goes under "video-1/"', () => {
			video = makeVideo({ outputPrefix: 'video-1/' });
		});
		When('I record a successful encode with manifests "manifest.mpd" and "master.m3u8", 912.4 seconds, and heights 1080, 720', () =>
			attempt(() => recordEncodingResult(dataSources())({ videoId: 'video-1', succeeded: { dashManifestPath: 'manifest.mpd', hlsManifestPath: 'master.m3u8', durationSeconds: 912.4, renditionHeights: [1080, 720] } })),
		);
		Then('the video should record success with blob names "video-1/manifest.mpd" and "video-1/master.m3u8" and be saved', () => {
			expect((video as FakeVideo).recordEncodingSucceeded).toHaveBeenCalledWith({
				dashManifestBlobName: 'video-1/manifest.mpd',
				hlsManifestBlobName: 'video-1/master.m3u8',
				durationSeconds: 912.4,
				renditionHeights: [1080, 720],
			});
			expect(save).toHaveBeenCalledWith(video);
		});
	});

	Scenario('Recording a failed encode', ({ Given, When, Then }) => {
		Given('an encoding video "video-1" whose output goes under "video-1/"', () => {
			video = makeVideo({ outputPrefix: 'video-1/' });
		});
		When('I record a failed encode with code "unsupported-source" and message "No video stream"', () =>
			attempt(() => recordEncodingResult(dataSources())({ videoId: 'video-1', failed: { code: 'unsupported-source', message: 'No video stream' } })),
		);
		Then('the video should record that failure and be saved', () => {
			expect((video as FakeVideo).recordEncodingFailed).toHaveBeenCalledWith({ code: 'unsupported-source', message: 'No video stream' });
			expect((video as FakeVideo).recordEncodingSucceeded).not.toHaveBeenCalled();
			expect(save).toHaveBeenCalledWith(video);
		});
	});
});
