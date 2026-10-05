import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import { expect, vi } from 'vitest';
import { completeUpload } from './complete-upload.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/complete-upload.feature'));

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let video: { sourceContainerName: string; sourceBlobName: string; sourceSizeBytes: number; markUploadCompleted: ReturnType<typeof vi.fn> };
	let storedSize: number | null;
	let save: ReturnType<typeof vi.fn>;
	let caught: unknown;

	const run = async () => {
		const dataSources = {
			domainDataSource: {
				Video: { Video: { VideoUnitOfWork: { withScopedTransaction: vi.fn(async (fn: (repo: unknown) => Promise<void>) => fn({ getById: vi.fn(async () => video), save })) } } },
			},
		} as unknown as DataSources;
		const blobStorage = {
			getBlobProperties: vi.fn(async () => (storedSize === null ? null : { contentLength: storedSize, contentType: 'video/mp4', lastModified: undefined, metadata: {} })),
		} as unknown as BlobStorageOperations;
		try {
			await completeUpload(dataSources, blobStorage)({ videoId: 'video-1' });
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		caught = undefined;
		save = vi.fn(async (saved: unknown) => saved);
		video = { sourceContainerName: 'video-uploads', sourceBlobName: 'c1/abc', sourceSizeBytes: 1024, markUploadCompleted: vi.fn() };
	});

	Scenario('Completing an upload that arrived with the declared size', ({ Given, When, Then }) => {
		Given('a video awaiting upload whose 1024-byte original is in storage', () => {
			storedSize = 1024;
		});
		When('I complete the upload', run);
		Then('the video should be marked uploaded and saved', () => {
			expect(caught).toBeUndefined();
			expect(video.markUploadCompleted).toHaveBeenCalled();
			expect(save).toHaveBeenCalledWith(video);
		});
	});

	Scenario('Completing an upload that never arrived', ({ Given, When, Then, And }) => {
		Given('a video awaiting upload whose original is not in storage', () => {
			storedSize = null;
		});
		When('I try to complete the upload', run);
		Then('it should fail with "The upload has not been received"', () => {
			expect((caught as Error).message).toBe('The upload has not been received');
		});
		And('the video should not be marked uploaded', () => {
			expect(video.markUploadCompleted).not.toHaveBeenCalled();
			expect(save).not.toHaveBeenCalled();
		});
	});

	Scenario('Completing an upload with the wrong size', ({ Given, When, Then, And }) => {
		Given('a video awaiting upload whose original in storage is 512 bytes instead of 1024', () => {
			storedSize = 512;
		});
		When('I try to complete the upload', run);
		Then('it should fail with "The upload is 512 bytes but 1024 bytes were expected"', () => {
			expect((caught as Error).message).toBe('The upload is 512 bytes but 1024 bytes were expected');
		});
		And('the video should not be marked uploaded', () => {
			expect(video.markUploadCompleted).not.toHaveBeenCalled();
		});
	});
});
