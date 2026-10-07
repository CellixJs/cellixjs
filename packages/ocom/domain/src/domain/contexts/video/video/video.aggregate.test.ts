import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import type { CommunityEntityReference, CommunityProps } from '../../community/community/community.ts';
import type { Passport } from '../../passport.ts';
import type { VideoDomainPermissions } from '../video.domain-permissions.ts';
import { type NewVideoSource, Video, type VideoCaptionTrack, type VideoPlayback, type VideoProps } from './video.aggregate.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video.aggregate.feature'));

const none: VideoDomainPermissions = { canManageVideos: false, canEncodeVideos: false, canViewVideos: false, isSystemAccount: false };
const manager: VideoDomainPermissions = { ...none, canManageVideos: true, canViewVideos: true };
const viewer: VideoDomainPermissions = { ...none, canViewVideos: true };
const encoder: VideoDomainPermissions = { ...none, canEncodeVideos: true, canViewVideos: true };

function makePassport(permissions: VideoDomainPermissions): Passport {
	return {
		community: { forCommunity: vi.fn() },
		video: { forVideo: vi.fn(() => ({ determineIf: (fn: (p: VideoDomainPermissions) => boolean) => fn(permissions) })) },
	} as unknown as Passport;
}

function makeCommunity(id = 'community-1'): CommunityEntityReference {
	return { id, name: 'Test Community' } as CommunityProps;
}

const source: NewVideoSource = { containerName: 'video-uploads', blobName: 'community-1/video-1', contentType: 'video/mp4', sizeBytes: 10 * 1024 * 1024 };
const destination = { containerName: 'videos-community-1', prefix: 'video-1/' };

function makeProps(overrides: Partial<VideoProps> = {}): VideoProps {
	const props: VideoProps = {
		id: 'video-1',
		community: makeCommunity() as CommunityProps,
		setCommunityRef: vi.fn((community: CommunityEntityReference) => {
			(props as { community: CommunityEntityReference }).community = community;
		}),
		title: 'Board meeting',
		status: 'AWAITING_UPLOAD',
		sourceContainerName: source.containerName,
		sourceBlobName: source.blobName,
		sourceContentType: source.contentType,
		sourceSizeBytes: source.sizeBytes,
		outputContainerName: null,
		outputPrefix: null,
		dashManifestBlobName: null,
		hlsManifestBlobName: null,
		durationSeconds: null,
		renditionHeights: [],
		failureCode: null,
		failureMessage: null,
		captionTracks: [],
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
		...overrides,
	};
	return props;
}

const uploaded: Partial<VideoProps> = { status: 'UPLOADED' };
const encoding: Partial<VideoProps> = { status: 'ENCODING', outputContainerName: destination.containerName, outputPrefix: destination.prefix };
const ready: Partial<VideoProps> = {
	...encoding,
	status: 'READY',
	dashManifestBlobName: 'video-1/manifest.mpd',
	hlsManifestBlobName: 'video-1/master.m3u8',
	durationSeconds: 900,
	renditionHeights: [1080, 720, 480, 360],
};
const failed: Partial<VideoProps> = { ...encoding, status: 'FAILED', failureCode: 'encode-failed', failureMessage: 'ffmpeg failed' };

const success = { dashManifestBlobName: 'video-1/manifest.mpd', hlsManifestBlobName: 'video-1/master.m3u8', durationSeconds: 900, renditionHeights: [1080, 720, 480, 360] };

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let community: CommunityEntityReference;
	let video: Video<VideoProps>;
	let caught: unknown;
	let playback: VideoPlayback | undefined;

	const attempt = (action: () => unknown) => {
		try {
			action();
		} catch (error) {
			caught = error;
		}
	};
	const existing = (overrides: Partial<VideoProps>, permissions: VideoDomainPermissions = manager) => {
		video = new Video(makeProps(overrides), makePassport(permissions));
	};
	const expectPermissionError = (message: string) => {
		expect(caught).toBeInstanceOf(PermissionError);
		expect((caught as Error).message).toBe(message);
	};

	BeforeEachScenario(() => {
		caught = undefined;
		playback = undefined;
	});

	Background(({ Given, And }) => {
		Given('a passport that can manage and view videos', () => {
			passport = makePassport(manager);
		});
		And('a valid CommunityEntityReference', () => {
			community = makeCommunity();
		});
	});

	Scenario('Creating a new video', ({ When, Then, And }) => {
		When('I create a new Video with title "Board meeting" and a 10 MB "video/mp4" source', () => {
			video = Video.getNewInstance(makeProps({ title: '', status: '' }), 'Board meeting', source, community, passport);
		});
		Then('the video\'s title should be "Board meeting"', () => {
			expect(video.title).toBe('Board meeting');
		});
		And('the video\'s status should be "AWAITING_UPLOAD"', () => {
			expect(video.status).toBe('AWAITING_UPLOAD');
		});
		And("the video's source should be the provided blob, content type, and size", () => {
			expect([video.sourceContainerName, video.sourceBlobName, video.sourceContentType, video.sourceSizeBytes]).toEqual([source.containerName, source.blobName, source.contentType, source.sizeBytes]);
			expect(video.community.id).toBe('community-1');
		});
		And('the video should have no encoding output or failure', () => {
			expect([video.outputContainerName, video.outputPrefix, video.dashManifestBlobName, video.hlsManifestBlobName, video.durationSeconds, video.failureCode, video.failureMessage]).toEqual([
				null,
				null,
				null,
				null,
				null,
				null,
				null,
			]);
			expect(video.renditionHeights).toEqual([]);
		});
	});

	Scenario('Creating a video without permission to manage videos', ({ Given, When, Then }) => {
		Given('a passport that can view but not manage videos', () => {
			passport = makePassport(viewer);
		});
		When('I try to create a new Video', () => {
			attempt(() => Video.getNewInstance(makeProps(), 'Board meeting', source, community, passport));
		});
		Then('a PermissionError should be thrown with message "You do not have permission to upload videos"', () => {
			expectPermissionError('You do not have permission to upload videos');
		});
	});

	Scenario('Creating a video with an unsupported content type', ({ When, Then }) => {
		When('I try to create a new Video with content type "image/png"', () => {
			attempt(() => Video.getNewInstance(makeProps(), 'Board meeting', { ...source, contentType: 'image/png' }, community, passport));
		});
		Then('an error should be thrown', () => {
			expect(caught).toBeInstanceOf(Error);
		});
	});

	Scenario('Creating a video larger than 2 GiB', ({ When, Then }) => {
		When('I try to create a new Video with a source of 2 GiB plus one byte', () => {
			attempt(() => Video.getNewInstance(makeProps(), 'Board meeting', { ...source, sizeBytes: 2 * 1024 * 1024 * 1024 + 1 }, community, passport));
		});
		Then('an error should be thrown', () => {
			expect(caught).toBeInstanceOf(Error);
		});
	});

	Scenario('Changing the title with permission to manage videos', ({ Given, When, Then }) => {
		Given('an existing video awaiting upload', () => {
			existing({});
		});
		When('I set the title to "Annual meeting"', () => {
			video.title = 'Annual meeting';
		});
		Then('the video\'s title should be "Annual meeting"', () => {
			expect(video.title).toBe('Annual meeting');
		});
	});

	Scenario('Changing the title without permission', ({ Given, When, Then }) => {
		Given('an existing video awaiting upload loaded with a passport that cannot manage videos', () => {
			existing({}, viewer);
		});
		When('I try to set the title to "Annual meeting"', () => {
			attempt(() => {
				video.title = 'Annual meeting';
			});
		});
		Then('a PermissionError should be thrown with message "You do not have permission to update this title"', () => {
			expectPermissionError('You do not have permission to update this title');
		});
	});

	Scenario('Changing the title to an empty value', ({ Given, When, Then }) => {
		Given('an existing video awaiting upload', () => {
			existing({});
		});
		When('I try to set the title to an empty string', () => {
			attempt(() => {
				video.title = '   ';
			});
		});
		Then('an error should be thrown', () => {
			expect(caught).toBeInstanceOf(Error);
		});
	});

	Scenario('Completing an upload', ({ Given, When, Then }) => {
		Given('an existing video awaiting upload', () => {
			existing({});
		});
		When('I mark the upload completed', () => {
			video.markUploadCompleted();
		});
		Then('the video\'s status should be "UPLOADED"', () => {
			expect(video.status).toBe('UPLOADED');
		});
	});

	Scenario('Completing an upload again', ({ Given, When, Then }) => {
		Given('an existing video that is uploaded', () => {
			existing(uploaded);
		});
		When('I mark the upload completed', () => {
			video.markUploadCompleted();
		});
		Then('the video\'s status should be "UPLOADED"', () => {
			expect(video.status).toBe('UPLOADED');
		});
	});

	Scenario('Completing an upload for a video that is already encoding', ({ Given, When, Then }) => {
		Given('an existing video that is encoding', () => {
			existing(encoding);
		});
		When('I try to mark the upload completed', () => {
			attempt(() => video.markUploadCompleted());
		});
		Then('an error should be thrown with message containing "while it is ENCODING"', () => {
			expect((caught as Error).message).toContain('while it is ENCODING');
		});
	});

	Scenario('Completing an upload without permission', ({ Given, When, Then }) => {
		Given('an existing video awaiting upload loaded with a passport that cannot manage videos', () => {
			existing({}, viewer);
		});
		When('I try to mark the upload completed', () => {
			attempt(() => video.markUploadCompleted());
		});
		Then('a PermissionError should be thrown with message "You do not have permission to complete this upload"', () => {
			expectPermissionError('You do not have permission to complete this upload');
		});
	});

	Scenario('Starting to encode an uploaded video as staff', ({ Given, When, Then, And }) => {
		Given('an existing video that is uploaded, loaded with a passport that can encode videos', () => {
			existing(uploaded, encoder);
		});
		When('I start encoding with destination container "videos-community-1" and prefix "video-1/"', () => {
			video.startEncoding(destination);
		});
		Then('the video\'s status should be "ENCODING"', () => {
			expect(video.status).toBe('ENCODING');
		});
		And('the video\'s output container should be "videos-community-1" with prefix "video-1/"', () => {
			expect([video.outputContainerName, video.outputPrefix]).toEqual(['videos-community-1', 'video-1/']);
		});
	});

	Scenario('Retrying a failed video clears the failure', ({ Given, When, Then, And }) => {
		Given('an existing video that has failed, loaded with a passport that can encode videos', () => {
			existing(failed, encoder);
		});
		When('I start encoding with destination container "videos-community-1" and prefix "video-1/"', () => {
			video.startEncoding(destination);
		});
		Then('the video\'s status should be "ENCODING"', () => {
			expect(video.status).toBe('ENCODING');
		});
		And('the video should have no failure', () => {
			expect([video.failureCode, video.failureMessage]).toEqual([null, null]);
		});
	});

	Scenario('Taking over a video that is already encoding', ({ Given, When, Then }) => {
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I start encoding with destination container "videos-community-1" and prefix "video-1/"', () => {
			video.startEncoding(destination);
		});
		Then('the video\'s status should be "ENCODING"', () => {
			expect(video.status).toBe('ENCODING');
		});
	});

	Scenario('Starting to encode a video that is still awaiting upload', ({ Given, When, Then }) => {
		Given('an existing video awaiting upload loaded with a passport that can encode videos', () => {
			existing({}, encoder);
		});
		When('I try to start encoding', () => {
			attempt(() => video.startEncoding(destination));
		});
		Then('an error should be thrown with message containing "while it is AWAITING_UPLOAD"', () => {
			expect((caught as Error).message).toContain('while it is AWAITING_UPLOAD');
		});
	});

	Scenario('Starting to encode a video that is already ready', ({ Given, When, Then }) => {
		Given('an existing video that is ready, loaded with a passport that can encode videos', () => {
			existing(ready, encoder);
		});
		When('I try to start encoding', () => {
			attempt(() => video.startEncoding(destination));
		});
		Then('an error should be thrown with message containing "while it is READY"', () => {
			expect((caught as Error).message).toContain('while it is READY');
		});
	});

	Scenario('Starting to encode without permission to encode videos', ({ Given, When, Then }) => {
		Given('an existing video that is uploaded', () => {
			existing(uploaded);
		});
		When('I try to start encoding', () => {
			attempt(() => video.startEncoding(destination));
		});
		Then('a PermissionError should be thrown with message "You do not have permission to encode videos"', () => {
			expectPermissionError('You do not have permission to encode videos');
		});
	});

	Scenario('Starting to encode with an invalid output prefix', ({ Given, When, Then, And }) => {
		Given('an existing video that is uploaded, loaded with a passport that can encode videos', () => {
			existing(uploaded, encoder);
		});
		When('I try to start encoding with prefix "video-1" that has no trailing slash', () => {
			attempt(() => video.startEncoding({ ...destination, prefix: 'video-1' }));
		});
		Then('an error should be thrown', () => {
			expect(caught).toBeInstanceOf(Error);
		});
		And('the video\'s status should be "UPLOADED"', () => {
			expect(video.status).toBe('UPLOADED');
		});
	});

	Scenario('Reporting which videos the caller can encode', ({ Given, Then }) => {
		let videos: Video<VideoProps>[] = [];
		Given('videos that are awaiting upload, uploaded, encoding, ready, and failed, loaded with a passport that can encode videos', () => {
			videos = [{}, uploaded, encoding, ready, failed].map((overrides) => new Video(makeProps(overrides), makePassport(encoder)));
		});
		Then('canEncode should be true only for the uploaded, encoding, and failed videos', () => {
			expect(videos.map((candidate) => candidate.canEncode())).toEqual([false, true, true, false, true]);
		});
	});

	Scenario('Reporting that a member cannot encode videos', ({ Given, Then }) => {
		Given('an existing video that is uploaded', () => {
			existing(uploaded);
		});
		Then('canEncode should be false', () => {
			expect(video.canEncode()).toBe(false);
		});
	});

	Scenario('Resolving output paths to blob names', ({ Given, When, Then }) => {
		let blobNames: string[] = [];
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I resolve the output paths "manifest.mpd" and "video/720/1.m4s"', () => {
			blobNames = video.resolveOutputBlobNames(['manifest.mpd', 'video/720/1.m4s']);
		});
		Then('the blob names should be "video-1/manifest.mpd" and "video-1/video/720/1.m4s"', () => {
			expect(blobNames).toEqual(['video-1/manifest.mpd', 'video-1/video/720/1.m4s']);
		});
	});

	Scenario("Rejecting output paths that escape the video's prefix", ({ Given, When, Then }) => {
		let attempts: (() => unknown)[] = [];
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I try to resolve the output paths "../video-2/manifest.mpd" and "/manifest.mpd"', () => {
			attempts = ['../video-2/manifest.mpd', '/manifest.mpd'].map((path) => () => video.resolveOutputBlobNames([path]));
		});
		Then('each attempt should throw an error', () => {
			for (const attemptPath of attempts) expect(attemptPath).toThrow();
		});
	});

	Scenario('Rejecting too many output paths at once', ({ Given, When, Then }) => {
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I try to resolve 1001 output paths', () => {
			attempt(() => video.resolveOutputBlobNames(Array.from({ length: 1001 }, (_, index) => `video/720/${index}.m4s`)));
		});
		Then('an error should be thrown with message containing "At most 1000 output files"', () => {
			expect((caught as Error).message).toContain('At most 1000 output files');
		});
	});

	Scenario('Resolving output paths for a video that is not encoding', ({ Given, When, Then }) => {
		Given('an existing video that is uploaded, loaded with a passport that can encode videos', () => {
			existing(uploaded, encoder);
		});
		When('I try to resolve the output path "manifest.mpd"', () => {
			attempt(() => video.resolveOutputBlobNames(['manifest.mpd']));
		});
		Then('an error should be thrown with message containing "while it is UPLOADED"', () => {
			expect((caught as Error).message).toContain('while it is UPLOADED');
		});
	});

	Scenario('Resolving output paths without permission to encode videos', ({ Given, When, Then }) => {
		Given('an existing video that is encoding', () => {
			existing(encoding);
		});
		When('I try to resolve the output path "manifest.mpd"', () => {
			attempt(() => video.resolveOutputBlobNames(['manifest.mpd']));
		});
		Then('a PermissionError should be thrown with message "You do not have permission to encode videos"', () => {
			expectPermissionError('You do not have permission to encode videos');
		});
	});

	Scenario('Recording a successful encode', ({ Given, When, Then, And }) => {
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I record a successful encode with manifests, a duration of 900 seconds, and rendition heights 1080, 720, 480, 360', () => {
			video.recordEncodingSucceeded(success);
		});
		Then('the video\'s status should be "READY"', () => {
			expect(video.status).toBe('READY');
		});
		And("the video's manifests, duration, and rendition heights should be recorded", () => {
			expect([video.dashManifestBlobName, video.hlsManifestBlobName, video.durationSeconds]).toEqual(['video-1/manifest.mpd', 'video-1/master.m3u8', 900]);
			expect(video.renditionHeights).toEqual([1080, 720, 480, 360]);
		});
	});

	Scenario('Recording a successful encode again replaces the result', ({ Given, When, Then, And }) => {
		Given('an existing video that is ready, loaded with a passport that can encode videos', () => {
			existing(ready, encoder);
		});
		When('I record a successful encode with manifests, a duration of 450 seconds, and rendition heights 720, 480, 360', () => {
			video.recordEncodingSucceeded({ ...success, durationSeconds: 450, renditionHeights: [720, 480, 360] });
		});
		Then('the video\'s status should be "READY"', () => {
			expect(video.status).toBe('READY');
		});
		And("the video's duration should be 450 seconds", () => {
			expect(video.durationSeconds).toBe(450);
		});
	});

	Scenario('Recording an encode result without permission to encode videos', ({ Given, When, Then }) => {
		Given('an existing video that is encoding', () => {
			existing(encoding);
		});
		When('I try to record a successful encode', () => {
			attempt(() => video.recordEncodingSucceeded(success));
		});
		Then('a PermissionError should be thrown with message "You do not have permission to record encoding results"', () => {
			expectPermissionError('You do not have permission to record encoding results');
		});
	});

	Scenario('Recording a successful encode for a video that is only uploaded', ({ Given, When, Then }) => {
		Given('an existing video that is uploaded, loaded with a passport that can encode videos', () => {
			existing(uploaded, encoder);
		});
		When('I try to record a successful encode', () => {
			attempt(() => video.recordEncodingSucceeded(success));
		});
		Then('an error should be thrown with message containing "while it is UPLOADED"', () => {
			expect((caught as Error).message).toContain('while it is UPLOADED');
		});
	});

	Scenario('Recording a failed encode', ({ Given, When, Then, And }) => {
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I record a failed encode with code "unsupported-source" and message "The source has no video stream"', () => {
			video.recordEncodingFailed({ code: 'unsupported-source', message: 'The source has no video stream' });
		});
		Then('the video\'s status should be "FAILED"', () => {
			expect(video.status).toBe('FAILED');
		});
		And('the video\'s failure should be code "unsupported-source" and message "The source has no video stream"', () => {
			expect([video.failureCode, video.failureMessage]).toEqual(['unsupported-source', 'The source has no video stream']);
		});
	});

	Scenario('Recording a successful encode after a failure', ({ Given, When, Then }) => {
		Given('an existing video that has failed, loaded with a passport that can encode videos', () => {
			existing(failed, encoder);
		});
		When('I try to record a successful encode', () => {
			attempt(() => video.recordEncodingSucceeded(success));
		});
		Then('an error should be thrown with message containing "while it is FAILED"', () => {
			expect((caught as Error).message).toContain('while it is FAILED');
		});
	});

	Scenario('Requesting playback of a ready video', ({ Given, When, Then }) => {
		Given('an existing video that is ready', () => {
			existing(ready, viewer);
		});
		When('I request playback', () => {
			playback = video.requestPlayback();
		});
		Then('I should get the output container and both manifest blob names', () => {
			expect(playback).toEqual({ containerName: 'videos-community-1', dashManifestBlobName: 'video-1/manifest.mpd', hlsManifestBlobName: 'video-1/master.m3u8', captionTracks: [] });
		});
	});

	Scenario('Requesting playback of a video that is not ready', ({ Given, When, Then }) => {
		Given('an existing video that is encoding', () => {
			existing(encoding, viewer);
		});
		When('I try to request playback', () => {
			attempt(() => video.requestPlayback());
		});
		Then('an error should be thrown with message containing "is not ready to play"', () => {
			expect((caught as Error).message).toContain('is not ready to play');
		});
	});

	Scenario('Requesting playback without permission to view videos', ({ Given, When, Then }) => {
		Given('an existing video that is ready, loaded with a passport that cannot view videos', () => {
			existing(ready, none);
		});
		When('I try to request playback', () => {
			attempt(() => video.requestPlayback());
		});
		Then('a PermissionError should be thrown with message "You do not have permission to watch this video"', () => {
			expectPermissionError('You do not have permission to watch this video');
		});
	});

	const englishTrack: VideoCaptionTrack = { language: 'en', label: 'English', kind: 'captions', containerName: 'videos-community-1', blobName: 'video-1/captions/en.vtt' };
	let track: VideoCaptionTrack | undefined;

	Scenario('Attaching captions', ({ Given, When, Then, And }) => {
		Given('an existing video that is uploaded', () => {
			existing(uploaded);
		});
		When('I attach "captions" in "en" labelled "English"', () => {
			track = video.attachCaption({ language: 'en', label: 'English', kind: 'captions' }, 'videos-community-1');
		});
		Then('the track should be stored at "video-1/captions/en.vtt" in the community\'s video container', () => {
			expect(track).toEqual(englishTrack);
		});
		And('the video should have one caption track', () => {
			expect(video.captionTracks).toEqual([englishTrack]);
		});
	});

	Scenario('Attaching captions in a language the video already has', ({ Given, When, Then }) => {
		Given('an existing video that is ready with English captions', () => {
			existing({ ...ready, captionTracks: [englishTrack] });
		});
		When('I attach "subtitles" in "en" labelled "English (SDH)"', () => {
			video.attachCaption({ language: 'en', label: 'English (SDH)', kind: 'subtitles' }, 'videos-community-1');
		});
		Then('the English track should be replaced', () => {
			expect(video.captionTracks).toEqual([{ ...englishTrack, label: 'English (SDH)', kind: 'subtitles' }]);
		});
	});

	Scenario('Attaching more caption tracks than allowed', ({ Given, When, Then }) => {
		Given('an existing video with 10 caption tracks', () => {
			const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'pl', 'ja'];
			existing({ ...uploaded, captionTracks: languages.map((language) => ({ ...englishTrack, language, blobName: `video-1/captions/${language}.vtt` })) });
		});
		When('I try to attach captions in "ko"', () => {
			attempt(() => video.attachCaption({ language: 'ko', label: 'Korean', kind: 'captions' }, 'videos-community-1'));
		});
		Then('an error should be thrown with message containing "at most 10 caption tracks"', () => {
			expect((caught as Error).message).toContain('at most 10 caption tracks');
		});
	});

	Scenario('Attaching captions with invalid details', ({ Given, When, Then }) => {
		let attempts: (() => unknown)[] = [];
		Given('an existing video that is uploaded', () => {
			existing(uploaded);
		});
		When('I try to attach captions with an invalid language, an empty label, or an unknown kind', () => {
			attempts = [
				() => video.attachCaption({ language: 'English', label: 'English', kind: 'captions' }, 'videos-community-1'),
				() => video.attachCaption({ language: '../en', label: 'English', kind: 'captions' }, 'videos-community-1'),
				() => video.attachCaption({ language: 'en', label: ' ', kind: 'captions' }, 'videos-community-1'),
				() => video.attachCaption({ language: 'en', label: 'English', kind: 'chapters' }, 'videos-community-1'),
			];
		});
		Then('each attempt should throw', () => {
			for (const attemptCaption of attempts) expect(attemptCaption).toThrow();
		});
	});

	Scenario('Attaching captions without permission to manage videos', ({ Given, When, Then }) => {
		Given('an existing video that is uploaded, loaded with a passport that can view but not manage videos', () => {
			existing(uploaded, viewer);
		});
		When('I try to attach captions in "en"', () => {
			attempt(() => video.attachCaption({ language: 'en', label: 'English', kind: 'captions' }, 'videos-community-1'));
		});
		Then('a PermissionError should be thrown with message "You do not have permission to manage captions"', () => {
			expectPermissionError('You do not have permission to manage captions');
		});
	});

	Scenario('Removing captions', ({ Given, When, Then, And }) => {
		Given('an existing video that is ready with English captions', () => {
			existing({ ...ready, captionTracks: [englishTrack] });
		});
		When('I remove the captions in "en"', () => {
			track = video.removeCaption('en');
		});
		Then('the removed track should be returned so its file can be deleted', () => {
			expect(track).toEqual(englishTrack);
		});
		And('the video should have no caption tracks', () => {
			expect(video.captionTracks).toEqual([]);
		});
	});

	Scenario('Removing captions in a language the video does not have', ({ Given, When, Then }) => {
		Given('an existing video that is ready with English captions', () => {
			existing({ ...ready, captionTracks: [englishTrack] });
		});
		When('I try to remove the captions in "fr"', () => {
			attempt(() => video.removeCaption('fr'));
		});
		Then('an error should be thrown with message containing "has no captions in fr"', () => {
			expect((caught as Error).message).toContain('has no captions in fr');
		});
	});

	Scenario('Removing captions without permission to manage videos', ({ Given, When, Then }) => {
		Given('an existing video that is ready with English captions, loaded with a passport that can view but not manage videos', () => {
			existing({ ...ready, captionTracks: [englishTrack] }, viewer);
		});
		When('I try to remove the captions in "en"', () => {
			attempt(() => video.removeCaption('en'));
		});
		Then('a PermissionError should be thrown with message "You do not have permission to manage captions"', () => {
			expectPermissionError('You do not have permission to manage captions');
		});
	});

	Scenario('Requesting playback of a ready video with captions', ({ Given, When, Then }) => {
		Given('an existing video that is ready with English captions', () => {
			existing({ ...ready, captionTracks: [englishTrack] }, viewer);
		});
		When('I request playback', () => {
			playback = video.requestPlayback();
		});
		Then('the playback should include the English caption track', () => {
			expect(playback?.captionTracks).toEqual([englishTrack]);
		});
	});

	Scenario('Encoded output cannot overwrite attached captions', ({ Given, When, Then }) => {
		Given('an existing video that is encoding, loaded with a passport that can encode videos', () => {
			existing(encoding, encoder);
		});
		When('I try to resolve the output path "captions/en.vtt"', () => {
			attempt(() => video.resolveOutputBlobNames(['captions/en.vtt']));
		});
		Then('an error should be thrown with message containing "cannot be written under captions/"', () => {
			expect((caught as Error).message).toContain('cannot be written under captions/');
		});
	});
});
