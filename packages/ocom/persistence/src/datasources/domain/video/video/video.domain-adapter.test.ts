import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Video } from '@ocom/data-sources-mongoose-models/video';
import { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import { VideoConverter, VideoDomainAdapter } from './video.domain-adapter.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapterFeature = await loadFeature(path.resolve(__dirname, 'features/video.domain-adapter.feature'));
const converterFeature = await loadFeature(path.resolve(__dirname, 'features/video.type-converter.feature'));

const communityId = '6898b0c34b4a2fbc01e9c697';

function makeCommunityDoc(): Community {
	return { id: communityId, name: 'Test Community' } as unknown as Community;
}

function makeVideoDoc(overrides: Partial<Video> = {}): Video {
	return {
		id: 'video-1',
		community: makeCommunityDoc(),
		title: 'Board meeting',
		status: 'READY',
		sourceContainerName: 'video-uploads',
		sourceBlobName: `${communityId}/video-1`,
		sourceContentType: 'video/mp4',
		sourceSizeBytes: 1024,
		outputContainerName: `videos-${communityId}`,
		outputPrefix: 'video-1/',
		dashManifestBlobName: 'video-1/manifest.mpd',
		hlsManifestBlobName: 'video-1/master.m3u8',
		durationSeconds: 900,
		renditionHeights: [1080, 720],
		failureCode: null,
		failureMessage: null,
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-02T00:00:00Z'),
		set(key: keyof Video, value: unknown) {
			(this as Video)[key] = value as never;
		},
		...overrides,
	} as Video;
}

function makePassport(): Domain.Passport {
	return {
		community: { forCommunity: vi.fn(() => ({ determineIf: vi.fn(() => true) })) },
		video: { forVideo: vi.fn(() => ({ determineIf: vi.fn(() => true) })) },
	} as unknown as Domain.Passport;
}

test.for(adapterFeature, ({ Scenario, Background }) => {
	let doc: Video;
	let adapter: VideoDomainAdapter;
	let result: unknown;
	let caught: unknown;

	const attempt = (action: () => unknown) => {
		caught = undefined;
		try {
			result = action();
		} catch (error) {
			caught = error;
		}
	};

	Background(({ Given }) => {
		Given('a Mongoose Video document that is ready, with a populated community', () => {
			doc = makeVideoDoc();
		});
	});

	Scenario('Reading the stored fields', ({ Given, Then }) => {
		Given('a VideoDomainAdapter for the document', () => {
			adapter = new VideoDomainAdapter(doc);
		});
		Then('the title, status, source, output, manifests, duration, rendition heights, and failure fields should match the document', () => {
			expect({
				title: adapter.title,
				status: adapter.status,
				sourceContainerName: adapter.sourceContainerName,
				sourceBlobName: adapter.sourceBlobName,
				sourceContentType: adapter.sourceContentType,
				sourceSizeBytes: adapter.sourceSizeBytes,
				outputContainerName: adapter.outputContainerName,
				outputPrefix: adapter.outputPrefix,
				dashManifestBlobName: adapter.dashManifestBlobName,
				hlsManifestBlobName: adapter.hlsManifestBlobName,
				durationSeconds: adapter.durationSeconds,
				renditionHeights: adapter.renditionHeights,
				failureCode: adapter.failureCode,
				failureMessage: adapter.failureMessage,
			}).toEqual({
				title: doc.title,
				status: doc.status,
				sourceContainerName: doc.sourceContainerName,
				sourceBlobName: doc.sourceBlobName,
				sourceContentType: doc.sourceContentType,
				sourceSizeBytes: doc.sourceSizeBytes,
				outputContainerName: doc.outputContainerName,
				outputPrefix: doc.outputPrefix,
				dashManifestBlobName: doc.dashManifestBlobName,
				hlsManifestBlobName: doc.hlsManifestBlobName,
				durationSeconds: doc.durationSeconds,
				renditionHeights: [1080, 720],
				failureCode: null,
				failureMessage: null,
			});
		});
	});

	Scenario('Writing fields back to the document', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for the document', () => {
			adapter = new VideoDomainAdapter(doc);
		});
		When('I set every writable field to new values', () => {
			adapter.title = 'Annual meeting';
			adapter.status = 'FAILED';
			adapter.sourceContainerName = 'other-uploads';
			adapter.sourceBlobName = 'other/blob';
			adapter.sourceContentType = 'video/webm';
			adapter.sourceSizeBytes = 2048;
			adapter.outputContainerName = 'videos-other';
			adapter.outputPrefix = 'other/';
			adapter.dashManifestBlobName = 'other/manifest.mpd';
			adapter.hlsManifestBlobName = 'other/master.m3u8';
			adapter.durationSeconds = 12;
			adapter.renditionHeights = [360];
			adapter.failureCode = 'encode-failed';
			adapter.failureMessage = 'ffmpeg failed';
		});
		Then('the document should hold the new values', () => {
			expect(doc).toMatchObject({
				title: 'Annual meeting',
				status: 'FAILED',
				sourceContainerName: 'other-uploads',
				sourceBlobName: 'other/blob',
				sourceContentType: 'video/webm',
				sourceSizeBytes: 2048,
				outputContainerName: 'videos-other',
				outputPrefix: 'other/',
				dashManifestBlobName: 'other/manifest.mpd',
				hlsManifestBlobName: 'other/master.m3u8',
				durationSeconds: 12,
				renditionHeights: [360],
				failureCode: 'encode-failed',
				failureMessage: 'ffmpeg failed',
			});
		});
	});

	Scenario('Returning copies of rendition heights', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for the document', () => {
			adapter = new VideoDomainAdapter(doc);
		});
		When('I modify the array returned by renditionHeights', () => {
			adapter.renditionHeights.push(144);
		});
		Then("the document's renditionHeights should be unchanged", () => {
			expect(doc.renditionHeights).toEqual([1080, 720]);
		});
	});

	Scenario('Reading missing optional fields as null', ({ Given, Then }) => {
		Given('a VideoDomainAdapter for a document without output, duration, or failure fields', () => {
			const bare = makeVideoDoc({ status: 'AWAITING_UPLOAD' }) as unknown as Record<string, unknown>;
			for (const key of ['outputContainerName', 'outputPrefix', 'dashManifestBlobName', 'hlsManifestBlobName', 'durationSeconds', 'renditionHeights', 'failureCode', 'failureMessage']) {
				delete bare[key];
			}
			adapter = new VideoDomainAdapter(bare as unknown as Video);
		});
		Then('the optional fields should be null and renditionHeights should be empty', () => {
			expect([adapter.outputContainerName, adapter.outputPrefix, adapter.dashManifestBlobName, adapter.hlsManifestBlobName, adapter.durationSeconds, adapter.failureCode, adapter.failureMessage]).toEqual([
				null,
				null,
				null,
				null,
				null,
				null,
				null,
			]);
			expect(adapter.renditionHeights).toEqual([]);
		});
	});

	Scenario('Getting the community when populated', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for the document', () => {
			adapter = new VideoDomainAdapter(doc);
		});
		When('I get the community property', () => {
			attempt(() => adapter.community);
		});
		Then('it should return a CommunityDomainAdapter for the populated community', () => {
			expect(result).toBeInstanceOf(CommunityDomainAdapter);
			expect((result as CommunityDomainAdapter).name).toBe('Test Community');
		});
	});

	Scenario('Getting the community when only its id is loaded', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for a document whose community is an ObjectId', () => {
			adapter = new VideoDomainAdapter(makeVideoDoc({ community: new MongooseSeedwork.ObjectId(communityId) }));
		});
		When('I get the community property', () => {
			attempt(() => adapter.community);
		});
		Then('it should return a reference with only the community id', () => {
			expect(result).toEqual({ id: communityId });
		});
	});

	Scenario('Getting the community when it is missing', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for a document without a community', () => {
			adapter = new VideoDomainAdapter(makeVideoDoc({ community: undefined as never }));
		});
		When('I get the community property', () => {
			attempt(() => adapter.community);
		});
		Then('an error should be thrown indicating "community is not populated"', () => {
			expect((caught as Error).message).toBe('community is not populated');
		});
	});

	Scenario('Setting the community reference', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for the document', () => {
			adapter = new VideoDomainAdapter(doc);
		});
		When('I call setCommunityRef with a community reference', () => {
			adapter.setCommunityRef({ id: communityId } as Domain.Contexts.Community.Community.CommunityEntityReference);
		});
		Then("the document's community should be set to an ObjectId with that id", () => {
			expect(doc.community).toBeInstanceOf(MongooseSeedwork.ObjectId);
			expect(String(doc.community)).toBe(communityId);
		});
	});

	Scenario('Setting a community reference without an id', ({ Given, When, Then }) => {
		Given('a VideoDomainAdapter for the document', () => {
			adapter = new VideoDomainAdapter(doc);
		});
		When('I call setCommunityRef with a reference that has no id', () => {
			attempt(() => adapter.setCommunityRef({} as Domain.Contexts.Community.Community.CommunityEntityReference));
		});
		Then('an error should be thrown indicating "community reference is missing id"', () => {
			expect((caught as Error).message).toBe('community reference is missing id');
		});
	});
});

test.for(converterFeature, ({ Scenario }) => {
	let doc: Video;
	let video: Domain.Contexts.Video.Video.Video<VideoDomainAdapter>;
	const converter = new VideoConverter();

	Scenario('Converting a Mongoose Video document to a domain object', ({ Given, When, Then }) => {
		let passport: Domain.Passport;
		Given('a Mongoose Video document and a passport', () => {
			doc = makeVideoDoc();
			passport = makePassport();
		});
		When('I call toDomain on the VideoConverter', () => {
			video = converter.toDomain(doc, passport);
		});
		Then("I should receive a Video domain object with the document's title and status", () => {
			expect(video).toBeInstanceOf(Domain.Contexts.Video.Video.Video);
			expect([video.title, video.status]).toEqual(['Board meeting', 'READY']);
		});
	});

	Scenario('Converting a domain object back to a Mongoose document', ({ Given, When, Then }) => {
		let persisted: Video;
		Given('a Video domain object created from a document', () => {
			doc = makeVideoDoc();
			video = converter.toDomain(doc, makePassport());
		});
		When('I call toPersistence on the VideoConverter', () => {
			persisted = converter.toPersistence(video);
		});
		Then('I should receive the original Mongoose document', () => {
			expect(persisted).toBe(doc);
		});
	});
});
