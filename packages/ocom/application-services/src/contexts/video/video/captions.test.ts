import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import { expect, vi } from 'vitest';
import { attachCaption } from './attach-caption.ts';
import { MaxCaptionFileBytes, toWebVtt } from './caption-file.ts';
import { removeCaption } from './remove-caption.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/captions.feature'));

const webVtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nWelcome to the annual meeting.\n';
const subRip = '1\r\n0:00:01,000 --> 0:00:03,500\r\nWelcome to the annual meeting.\r\n\r\n2\r\n00:01:02,250 --> 00:01:04,000\r\n<i>[applause]</i>\r\n';
const englishTrack = { language: 'en', label: 'English', kind: 'captions', containerName: 'videos-c0ffee000000000000000001', blobName: 'video-1/captions/en.vtt' };

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let video: { community: { id: string }; attachCaption: ReturnType<typeof vi.fn>; removeCaption: ReturnType<typeof vi.fn> };
	let blobStorage: { createContainerIfNotExists: ReturnType<typeof vi.fn>; uploadText: ReturnType<typeof vi.fn>; deleteBlob: ReturnType<typeof vi.fn> };
	let save: ReturnType<typeof vi.fn>;
	let caught: unknown;

	const dataSources = () =>
		({
			domainDataSource: {
				Video: { Video: { VideoUnitOfWork: { withScopedTransaction: vi.fn(async (fn: (repo: unknown) => Promise<void>) => fn({ getById: vi.fn(async () => video), save })) } } },
			},
		}) as unknown as DataSources;
	const attach = async (content: string) => {
		try {
			await attachCaption(dataSources(), blobStorage as unknown as BlobStorageOperations)({ videoId: 'video-1', language: 'en', label: 'English', kind: 'captions', content });
		} catch (error) {
			caught = error;
		}
	};
	const remove = async () => {
		try {
			await removeCaption(dataSources(), blobStorage as unknown as BlobStorageOperations)({ videoId: 'video-1', language: 'en' });
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		caught = undefined;
		save = vi.fn(async (saved: unknown) => saved);
		blobStorage = { createContainerIfNotExists: vi.fn(async () => undefined), uploadText: vi.fn(async () => ({})), deleteBlob: vi.fn(async () => undefined) };
		video = {
			community: { id: 'C0FFEE000000000000000001' },
			attachCaption: vi.fn((_caption: unknown, containerName: string) => ({ ...englishTrack, containerName })),
			removeCaption: vi.fn(() => englishTrack),
		};
	});

	Scenario('Attaching a WebVTT file', ({ Given, When, Then, And }) => {
		Given('a video in community "C0FFEE000000000000000001" that accepts "en" captions', () => undefined);
		When('I attach a WebVTT file in "en" labelled "English"', () => attach(webVtt));
		Then(`the file should be stored as WebVTT at the track's blob in "videos-c0ffee000000000000000001"`, () => {
			expect(video.attachCaption).toHaveBeenCalledWith({ language: 'en', label: 'English', kind: 'captions' }, 'videos-c0ffee000000000000000001');
			expect(blobStorage.createContainerIfNotExists).toHaveBeenCalledWith({ containerName: 'videos-c0ffee000000000000000001' });
			expect(blobStorage.uploadText).toHaveBeenCalledWith({
				containerName: 'videos-c0ffee000000000000000001',
				blobName: 'video-1/captions/en.vtt',
				text: webVtt,
				httpHeaders: { blobContentType: 'text/vtt; charset=utf-8' },
			});
		});
		And('the video should be saved', () => {
			expect(save).toHaveBeenCalledWith(video);
		});
	});

	Scenario('Attaching a SubRip file', ({ Given, When, Then }) => {
		Given('a video in community "C0FFEE000000000000000001" that accepts "en" captions', () => undefined);
		When('I attach a SubRip file in "en" labelled "English"', () => attach(subRip));
		Then('the stored file should be the converted WebVTT', () => {
			expect(blobStorage.uploadText.mock.calls[0]?.[0]).toMatchObject({ text: toWebVtt(subRip) });
		});
	});

	Scenario('Attaching a file that is not captions', ({ Given, When, Then, And }) => {
		Given('a video in community "C0FFEE000000000000000001" that accepts "en" captions', () => undefined);
		When('I try to attach a file that is neither WebVTT nor SubRip', () => attach('Just some notes about the meeting.'));
		Then('it should fail with "Captions must be a WebVTT (.vtt) or SubRip (.srt) file"', () => {
			expect((caught as Error).message).toBe('Captions must be a WebVTT (.vtt) or SubRip (.srt) file');
		});
		And('nothing should be stored or saved', () => {
			expect(blobStorage.uploadText).not.toHaveBeenCalled();
			expect(save).not.toHaveBeenCalled();
		});
	});

	Scenario('Attaching captions the domain refuses', ({ Given, When, Then, And }) => {
		Given('a video whose domain refuses captions with "You do not have permission to manage captions"', () => {
			video.attachCaption.mockImplementation(() => {
				throw new Error('You do not have permission to manage captions');
			});
		});
		When('I try to attach a WebVTT file in "en" labelled "English"', () => attach(webVtt));
		Then('it should fail with "You do not have permission to manage captions"', () => {
			expect((caught as Error).message).toBe('You do not have permission to manage captions');
		});
		And('nothing should be stored or saved', () => {
			expect(blobStorage.uploadText).not.toHaveBeenCalled();
			expect(save).not.toHaveBeenCalled();
		});
	});

	Scenario('Removing captions', ({ Given, When, Then, And }) => {
		Given('a video with English captions', () => undefined);
		When('I remove the captions in "en"', remove);
		Then('the video should be saved without them', () => {
			expect(video.removeCaption).toHaveBeenCalledWith('en');
			expect(save).toHaveBeenCalledWith(video);
		});
		And('the caption file should be deleted', () => {
			expect(blobStorage.deleteBlob).toHaveBeenCalledWith({ containerName: englishTrack.containerName, blobName: englishTrack.blobName });
		});
	});

	Scenario('Removing captions when the file cannot be deleted', ({ Given, When, Then, And }) => {
		Given('a video with English captions whose file cannot be deleted', () => {
			blobStorage.deleteBlob.mockRejectedValue(new Error('BlobNotFound'));
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
		});
		When('I remove the captions in "en"', remove);
		Then('the video should be saved without them', () => {
			expect(save).toHaveBeenCalledWith(video);
		});
		And('the removal should still succeed', () => {
			expect(caught).toBeUndefined();
		});
	});

	Scenario('Converting caption files to WebVTT', ({ Then, And }) => {
		Then('WebVTT files should be kept with normalized line endings', () => {
			expect(toWebVtt('﻿WEBVTT - Annual meeting\r\n\r\n00:01.000 --> 00:03.500\r\nWelcome.')).toBe('WEBVTT - Annual meeting\n\n00:01.000 --> 00:03.500\nWelcome.\n');
			expect(toWebVtt(webVtt)).toBe(webVtt);
		});
		And('SubRip timestamps should be converted and the WEBVTT header added', () => {
			expect(toWebVtt(subRip)).toBe('WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.500\nWelcome to the annual meeting.\n\n2\n00:01:02.250 --> 00:01:04.000\n<i>[applause]</i>\n');
		});
		And('files larger than 1 MB, WebVTT files without cues, and other files should be rejected', () => {
			expect(() => toWebVtt(`WEBVTT\n\n${'a'.repeat(MaxCaptionFileBytes)}`)).toThrow('Caption files must be 1 MB or smaller');
			expect(() => toWebVtt('WEBVTT\n\nNOTE nothing here\n')).toThrow('The WebVTT file has no captions');
			expect(() => toWebVtt('WEBVTTX\n\n00:01.000 --> 00:03.500\nHi\n')).toThrow('Captions must be a WebVTT (.vtt) or SubRip (.srt) file');
			expect(() => toWebVtt('')).toThrow('Captions must be a WebVTT (.vtt) or SubRip (.srt) file');
		});
	});
});
