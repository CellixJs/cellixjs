import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoViewing } from '@ocom/data-sources-mongoose-models/video-viewing';
import { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { VideoViewingConverter, VideoViewingDomainAdapter } from './video-viewing.domain-adapter.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.domain-adapter.feature'));

const communityId = '6898b0c34b4a2fbc01e9c697';
const memberId = '6898b0c34b4a2fbc01e9c6a1';
const videoId = '6898b0c34b4a2fbc01e9c6b2';
const lastReportAt = new Date('2026-10-07T12:10:00Z');
const completedAt = new Date('2026-10-07T12:10:00Z');

function makeDoc(overrides: Partial<VideoViewing> = {}): VideoViewing {
	return {
		id: 'viewing-1',
		set(key: keyof VideoViewing, value: unknown) {
			(this as VideoViewing)[key] = value as never;
		},
		...overrides,
	} as VideoViewing;
}

function makeStoredDoc(): VideoViewing {
	return makeDoc({
		community: new MongooseSeedwork.ObjectId(communityId),
		video: new MongooseSeedwork.ObjectId(videoId),
		member: new MongooseSeedwork.ObjectId(memberId),
		durationSeconds: 600,
		bucketSeconds: 5,
		bucketCount: 120,
		watchedBuckets: [
			{ start: 0, end: 11 },
			{ start: 118, end: 119 },
		],
		watchedBucketCount: 14,
		creditSeconds: 50,
		lastReportAt,
		completedAt,
	});
}

test.for(feature, ({ Scenario }) => {
	let adapter: VideoViewingDomainAdapter;
	let doc: VideoViewing;

	Scenario('Reading the stored fields', ({ Given, Then, And }) => {
		Given('a VideoViewingDomainAdapter for a stored viewing', () => {
			adapter = new VideoViewingDomainAdapter(makeStoredDoc());
		});
		Then('the references should be read as id strings', () => {
			expect([adapter.communityId, adapter.videoId, adapter.memberId]).toEqual([communityId, videoId, memberId]);
		});
		And('the buckets, counts, credit, and dates should be read as stored', () => {
			expect([adapter.durationSeconds, adapter.bucketSeconds, adapter.bucketCount, adapter.watchedBucketCount, adapter.creditSeconds]).toEqual([600, 5, 120, 14, 50]);
			expect(adapter.watchedBuckets).toEqual([
				{ start: 0, end: 11 },
				{ start: 118, end: 119 },
			]);
			expect([adapter.lastReportAt, adapter.completedAt]).toEqual([lastReportAt, completedAt]);
		});
	});

	Scenario('Reading a new document without values', ({ Given, Then, And }) => {
		Given('a VideoViewingDomainAdapter for a new document', () => {
			adapter = new VideoViewingDomainAdapter(makeDoc());
		});
		Then('the references should be empty strings', () => {
			expect([adapter.communityId, adapter.videoId, adapter.memberId]).toEqual(['', '', '']);
		});
		And('there should be no watched buckets, credit, or report and completion dates', () => {
			expect(adapter.watchedBuckets).toEqual([]);
			expect([adapter.watchedBucketCount, adapter.creditSeconds, adapter.lastReportAt, adapter.completedAt]).toEqual([0, 0, null, null]);
		});
	});

	Scenario('Writing the fields', ({ Given, When, Then }) => {
		Given('a VideoViewingDomainAdapter for a new document', () => {
			doc = makeDoc();
			adapter = new VideoViewingDomainAdapter(doc);
		});
		When('I set the references, buckets, counts, credit, and dates', () => {
			adapter.communityId = communityId;
			adapter.videoId = videoId;
			adapter.memberId = memberId;
			adapter.durationSeconds = 600;
			adapter.bucketSeconds = 5;
			adapter.bucketCount = 120;
			adapter.watchedBuckets = [{ start: 0, end: 3 }];
			adapter.watchedBucketCount = 4;
			adapter.creditSeconds = 10;
			adapter.lastReportAt = lastReportAt;
			adapter.completedAt = null;
		});
		Then('the document should hold ObjectId references and the new values', () => {
			expect(doc.community).toBeInstanceOf(MongooseSeedwork.ObjectId);
			expect([String(doc.community), String(doc.video), String(doc.member)]).toEqual([communityId, videoId, memberId]);
			expect([doc.durationSeconds, doc.bucketSeconds, doc.bucketCount, doc.watchedBucketCount, doc.creditSeconds]).toEqual([600, 5, 120, 4, 10]);
			expect(doc.watchedBuckets).toEqual([{ start: 0, end: 3 }]);
			expect([doc.lastReportAt, doc.completedAt]).toEqual([lastReportAt, null]);
		});
	});

	Scenario('Converting a stored viewing to the domain', ({ Given, When, Then }) => {
		let passport: Domain.Passport;
		let viewing: Domain.Contexts.Video.VideoViewing.VideoViewing<VideoViewingDomainAdapter>;
		Given('a stored viewing and a passport', () => {
			doc = makeStoredDoc();
			passport = { video: { forVideoViewing: vi.fn(() => ({ determineIf: vi.fn(() => true) })) } } as unknown as Domain.Passport;
		});
		When('I call toDomain on the VideoViewingConverter', () => {
			viewing = new VideoViewingConverter().toDomain(doc, passport);
		});
		Then('I should receive a VideoViewing with the stored coverage', () => {
			expect(viewing).toBeInstanceOf(Domain.Contexts.Video.VideoViewing.VideoViewing);
			expect(viewing.coverage).toBeCloseTo(14 / 120);
			expect(viewing.unwatchedRanges).toEqual([{ start: 60, end: 590 }]);
		});
	});
});
