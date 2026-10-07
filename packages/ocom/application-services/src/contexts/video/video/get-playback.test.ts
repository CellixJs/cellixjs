import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { expect, vi } from 'vitest';
import { getPlayback, type VideoPlaybackResult } from './get-playback.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/get-playback.feature'));

const container = 'videos-c0ffee000000000000000001';

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let video: { requestPlayback: ReturnType<typeof vi.fn> } | null;
	let clientOperations: ClientUploadOperations;
	let result: VideoPlaybackResult | undefined;
	let caught: unknown;

	const run = async () => {
		const dataSources = { readonlyDataSource: { Video: { Video: { VideoReadRepo: { getById: vi.fn(async () => video) } } } } } as unknown as DataSources;
		const blobStorage = { getBlobUrl: vi.fn((address: { containerName: string; blobName: string }) => `https://storage.test/${address.containerName}/${address.blobName}`) } as unknown as BlobStorageOperations;
		try {
			result = await getPlayback(dataSources, blobStorage, clientOperations)({ videoId: 'video-1' });
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		result = undefined;
		caught = undefined;
		clientOperations = { generateContainerReadSasToken: vi.fn(async () => 'sv=1&sr=c&sp=r&sig=abc') } as unknown as ClientUploadOperations;
	});

	Scenario('Getting playback for a ready video', ({ Given, When, Then, And }) => {
		Given(`a ready video whose output is in "${container}"`, () => {
			video = { requestPlayback: vi.fn(() => ({ containerName: container, dashManifestBlobName: 'video-1/manifest.mpd', hlsManifestBlobName: 'video-1/master.m3u8', captionTracks: [] })) };
		});
		When('I get playback for the video', run);
		Then('I should receive both manifest URLs and a container read token', () => {
			expect(result).toMatchObject({
				dashManifestUrl: `https://storage.test/${container}/video-1/manifest.mpd`,
				hlsManifestUrl: `https://storage.test/${container}/video-1/master.m3u8`,
				sasToken: 'sv=1&sr=c&sp=r&sig=abc',
			});
		});
		And("the token should be for the video's output container and expire in 2 hours", () => {
			const [request] = (clientOperations.generateContainerReadSasToken as ReturnType<typeof vi.fn>).mock.calls[0] as [{ containerName: string; expiresOn: Date }];
			expect(request.containerName).toBe(container);
			expect(Math.abs(request.expiresOn.getTime() - Date.now() - 2 * 60 * 60 * 1000)).toBeLessThan(5000);
			expect(result?.expiresAt).toEqual(request.expiresOn);
		});
	});

	Scenario('Getting playback for a ready video with captions', ({ Given, When, Then }) => {
		Given('a ready video with English captions in its output container and a stray track in another container', () => {
			const english = { language: 'en', label: 'English', kind: 'captions', containerName: container, blobName: 'video-1/captions/en.vtt' };
			const stray = { ...english, language: 'fr', containerName: 'videos-elsewhere', blobName: 'video-1/captions/fr.vtt' };
			video = { requestPlayback: vi.fn(() => ({ containerName: container, dashManifestBlobName: 'video-1/manifest.mpd', hlsManifestBlobName: 'video-1/master.m3u8', captionTracks: [english, stray] })) };
		});
		When('I get playback for the video', run);
		Then('I should receive a URL for the English captions only', () => {
			expect(result?.captionTracks).toEqual([{ language: 'en', label: 'English', kind: 'captions', url: `https://storage.test/${container}/video-1/captions/en.vtt` }]);
		});
	});

	Scenario('Getting playback for a video that does not exist', ({ Given, When, Then }) => {
		Given('no video exists', () => {
			video = null;
		});
		When('I try to get playback for the video', run);
		Then('it should fail with "Video not found"', () => {
			expect((caught as Error).message).toBe('Video not found');
		});
	});

	Scenario('Getting playback when the domain refuses', ({ Given, When, Then, And }) => {
		Given('a video whose playback the domain refuses with "Video video-1 is not ready to play"', () => {
			video = {
				requestPlayback: vi.fn(() => {
					throw new Error('Video video-1 is not ready to play');
				}),
			};
		});
		When('I try to get playback for the video', run);
		Then('it should fail with "Video video-1 is not ready to play"', () => {
			expect((caught as Error).message).toBe('Video video-1 is not ready to play');
		});
		And('no token should be issued', () => {
			expect(clientOperations.generateContainerReadSasToken).not.toHaveBeenCalled();
		});
	});
});
