import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { addBuckets, bucketBounds, includesBucket, mergeTimeRanges, playedBuckets, playedThrough, unwatchedTimeRanges, type VideoBucketRange, type VideoTimeRange } from './video-viewing.buckets.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.buckets.feature'));

// A 12 second video in 5 second buckets: 0 to 5, 5 to 10, and a short last bucket, 10 to 12.
const BUCKET_SECONDS = 5;
const DURATION_SECONDS = 12;
const BUCKET_COUNT = 3;

test.for(feature, ({ Scenario }) => {
	Scenario('Merging played ranges', ({ When, Then, And }) => {
		const ranges: VideoTimeRange[] = [
			{ start: 5, end: 8 },
			{ start: 0, end: 3 },
			{ start: 3, end: 4 },
			{ start: 7, end: 10 },
		];
		let merged: VideoTimeRange[];
		When('I merge the ranges 5 to 8, 0 to 3, 3 to 4, and 7 to 10', () => {
			merged = mergeTimeRanges(ranges);
		});
		Then('the merged ranges should be 0 to 4 and 5 to 10', () => {
			expect(merged).toEqual([
				{ start: 0, end: 4 },
				{ start: 5, end: 10 },
			]);
		});
		And('the original ranges should be unchanged', () => {
			expect(ranges[1]).toEqual({ start: 0, end: 3 });
		});
	});

	Scenario('Finding how far play reaches without a gap', ({ When, Then }) => {
		let reached: number;
		When('I check how far play reaches from 0 through 0 to 4, 4.5 to 6, and 9 to 10 with a 1 second tolerance', () => {
			reached = playedThrough(
				0,
				[
					{ start: 0, end: 4 },
					{ start: 4.5, end: 6 },
					{ start: 9, end: 10 },
				],
				1,
			);
		});
		Then('play should reach 6 seconds', () => {
			expect(reached).toBe(6);
		});
	});

	Scenario('Clipping the last bucket to the end of the video', ({ When, Then, And }) => {
		let bounds: VideoTimeRange[];
		When('I get the bounds of buckets 1 and 2 of a 12 second video with 5 second buckets', () => {
			bounds = [1, 2].map((index) => bucketBounds(index, BUCKET_SECONDS, DURATION_SECONDS));
		});
		Then('bucket 1 should span 5 to 10 seconds', () => {
			expect(bounds[0]).toEqual({ start: 5, end: 10 });
		});
		And('bucket 2 should span 10 to 12 seconds', () => {
			expect(bounds[1]).toEqual({ start: 10, end: 12 });
		});
	});

	Scenario('Counting a bucket only when half of it was played', ({ When, Then }) => {
		let played: number[];
		When('I find the played buckets of a 12 second video played from 0 to 3, 6 to 7, and 10 to 11', () => {
			played = playedBuckets(
				[
					{ start: 0, end: 3 },
					{ start: 6, end: 7 },
					{ start: 10, end: 11 },
				],
				BUCKET_SECONDS,
				DURATION_SECONDS,
				BUCKET_COUNT,
				0.5,
			);
		});
		Then('buckets 0 and 2 should be played', () => {
			// Bucket 1 had 1 of 5 seconds played; the short last bucket had 1 of 2.
			expect(played).toEqual([0, 2]);
		});
	});

	Scenario('Adding buckets and joining adjacent runs', ({ When, Then, And }) => {
		let runs: VideoBucketRange[];
		When('I add buckets 2 and 5 to the run 0 to 1', () => {
			runs = addBuckets([{ start: 0, end: 1 }], [2, 5]);
		});
		Then('the runs should be 0 to 2 and 5 to 5', () => {
			expect(runs).toEqual([
				{ start: 0, end: 2 },
				{ start: 5, end: 5 },
			]);
		});
		And('bucket 5 should be included', () => {
			expect(includesBucket(runs, 5)).toBe(true);
		});
		And('bucket 3 should not be included', () => {
			expect(includesBucket(runs, 3)).toBe(false);
		});
	});

	Scenario('Listing the unwatched spans', ({ When, Then }) => {
		let unwatched: VideoTimeRange[];
		When('I list the unwatched spans of a 12 second video where only bucket 1 was played', () => {
			unwatched = unwatchedTimeRanges([{ start: 1, end: 1 }], BUCKET_SECONDS, DURATION_SECONDS, BUCKET_COUNT);
		});
		Then('the unwatched spans should be 0 to 5 and 10 to 12 seconds', () => {
			expect(unwatched).toEqual([
				{ start: 0, end: 5 },
				{ start: 10, end: 12 },
			]);
		});
	});
});
