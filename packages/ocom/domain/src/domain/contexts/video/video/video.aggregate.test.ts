import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import type { CommunityEntityReference, CommunityProps } from '../../community/community/community.ts';
import type { Passport } from '../../passport.ts';
import type { VideoDomainPermissions } from '../video.domain-permissions.ts';
import { type NewVideoSource, Video, type VideoPlayback, type VideoProps } from './video.aggregate.ts';

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
			expect(playback).toEqual({ containerName: 'videos-community-1', dashManifestBlobName: 'video-1/manifest.mpd', hlsManifestBlobName: 'video-1/master.m3u8' });
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
});
