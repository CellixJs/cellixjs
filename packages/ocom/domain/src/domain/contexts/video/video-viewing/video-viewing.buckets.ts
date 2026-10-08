/** A span of a video, in seconds. */
export interface VideoTimeRange {
	start: number;
	end: number;
}

/** A run of consecutive buckets, by index, inclusive at both ends. */
export interface VideoBucketRange {
	start: number;
	end: number;
}

/** Sorts ranges and joins the ones that overlap or touch. */
export function mergeTimeRanges(ranges: readonly VideoTimeRange[]): VideoTimeRange[] {
	const sorted = [...ranges].sort((a, b) => a.start - b.start);
	const merged: VideoTimeRange[] = [];
	for (const range of sorted) {
		const last = merged.at(-1);
		if (last && range.start <= last.end) {
			last.end = Math.max(last.end, range.end);
		} else {
			merged.push({ ...range });
		}
	}
	return merged;
}

/**
 * How far played time reaches without a gap, starting from a point already
 * reached. Gaps up to `tolerance` seconds are joined, such as the small jump
 * when a player resumes.
 *
 * @param played - Merged, non-overlapping ranges in seconds, in ascending order.
 */
export function playedThrough(from: number, played: readonly VideoTimeRange[], tolerance: number): number {
	let reached = from;
	for (const range of played) {
		if (range.start > reached + tolerance) {
			break;
		}
		reached = Math.max(reached, range.end);
	}
	return reached;
}

/** Where a bucket starts and ends, in seconds. The last bucket ends at the video's end. */
export function bucketBounds(index: number, bucketSeconds: number, durationSeconds: number): VideoTimeRange {
	return { start: index * bucketSeconds, end: Math.min((index + 1) * bucketSeconds, durationSeconds) };
}

/**
 * Buckets that the played ranges cover by at least `playedShare` of their
 * length, in ascending order.
 *
 * @param played - Merged, non-overlapping ranges in seconds.
 */
export function playedBuckets(played: readonly VideoTimeRange[], bucketSeconds: number, durationSeconds: number, bucketCount: number, playedShare: number): number[] {
	const overlap = new Map<number, number>();
	for (const range of played) {
		const first = Math.floor(range.start / bucketSeconds);
		const last = Math.min(bucketCount - 1, Math.ceil(range.end / bucketSeconds) - 1);
		for (let index = first; index <= last; index++) {
			const bounds = bucketBounds(index, bucketSeconds, durationSeconds);
			const seconds = Math.min(range.end, bounds.end) - Math.max(range.start, bounds.start);
			if (seconds > 0) {
				overlap.set(index, (overlap.get(index) ?? 0) + seconds);
			}
		}
	}
	return [...overlap.entries()]
		.filter(([index, seconds]) => {
			const bounds = bucketBounds(index, bucketSeconds, durationSeconds);
			return seconds >= (bounds.end - bounds.start) * playedShare;
		})
		.map(([index]) => index)
		.sort((a, b) => a - b);
}

/** Whether a bucket is inside one of the ranges. */
export function includesBucket(ranges: readonly VideoBucketRange[], index: number): boolean {
	return ranges.some((range) => index >= range.start && index <= range.end);
}

/** Adds buckets to ranges, joining runs that become adjacent. */
export function addBuckets(ranges: readonly VideoBucketRange[], indexes: readonly number[]): VideoBucketRange[] {
	const all = [...ranges.map((range) => ({ ...range })), ...indexes.map((index) => ({ start: index, end: index }))].sort((a, b) => a.start - b.start);
	const merged: VideoBucketRange[] = [];
	for (const range of all) {
		const last = merged.at(-1);
		if (last && range.start <= last.end + 1) {
			last.end = Math.max(last.end, range.end);
		} else {
			merged.push(range);
		}
	}
	return merged;
}

/** Spans of the video, in seconds, whose buckets are not in the ranges. */
export function unwatchedTimeRanges(ranges: readonly VideoBucketRange[], bucketSeconds: number, durationSeconds: number, bucketCount: number): VideoTimeRange[] {
	const gaps: VideoTimeRange[] = [];
	let next = 0;
	for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
		if (range.start > next) {
			gaps.push({ start: next * bucketSeconds, end: bucketBounds(range.start - 1, bucketSeconds, durationSeconds).end });
		}
		next = Math.max(next, range.end + 1);
	}
	if (next < bucketCount) {
		gaps.push({ start: next * bucketSeconds, end: durationSeconds });
	}
	return gaps;
}
