import { useEffect, useRef } from 'react';

/** A span of the video that was played, in seconds. */
export interface PlayedRange {
	start: number;
	end: number;
}

/** Replay counts a playback session has reached, by bucket index. */
export interface ReplayReport {
	sessionId: string;
	counts: number[];
}

/** How often to report while the video is playing. */
const ReportIntervalMs = 15_000;

/** Length of one bucket of the video's timeline, matching the domain's buckets. */
const BucketSeconds = 5;

/**
 * How far behind the furthest point played the playhead must be before play
 * counts as a replay. Absorbs the small jumps a player makes between segments.
 */
const ReplayMarginSeconds = 2;

/**
 * The spans the video element has actually played. Browsers add to `played`
 * only while media plays, so skipping ahead leaves the skipped part out.
 */
function readPlayedRanges(element: HTMLVideoElement): PlayedRange[] {
	const ranges: PlayedRange[] = [];
	for (let index = 0; index < element.played.length; index++) {
		ranges.push({ start: element.played.start(index), end: element.played.end(index) });
	}
	return ranges;
}

/**
 * Reports what a video element has played, and where its playhead is: every
 * 15 seconds while it plays, and when it pauses, ends, the page is hidden, or
 * the component unmounts. Each report sends everything played so far; the API
 * ignores spans it has already counted, so a report that fails is covered by
 * the next one. The position lets the member resume where they stopped.
 *
 * It also counts replays: play below the furthest point the member has already
 * reached, which on a first watch means they rewound, and after they finish
 * means they came back to a part. Counts are cumulative for the session, so a
 * report that failed is covered by the next one.
 *
 * @param element - The player's video element, once the player is ready.
 * @param report - Sends the played spans, the playhead's position in seconds, and the session's replay counts. Resolves to whether they were saved.
 * @param watchedThroughSeconds - How far the member had already played without a gap, so play up to there is not counted as a replay. Omit before it is known.
 */
export function useWatchProgressReporter(element: HTMLVideoElement | undefined, report: (ranges: PlayedRange[], position: number, replay: ReplayReport) => Promise<boolean>, watchedThroughSeconds?: number): void {
	const reportRef = useRef(report);
	reportRef.current = report;
	// Seeded once from the server so a reload does not read the first pass as a replay.
	const furthestRef = useRef(watchedThroughSeconds ?? 0);
	if (watchedThroughSeconds !== undefined && watchedThroughSeconds > furthestRef.current) {
		furthestRef.current = watchedThroughSeconds;
	}

	useEffect(() => {
		if (!element) {
			return;
		}
		let lastSaved = '';
		let sending = false;
		let sendAgain = false;
		const sessionId = crypto.randomUUID();
		const counts: number[] = [];
		// The bucket the current pass is in, so a bucket counts once per pass through it.
		let countedBucket: number | null = null;

		const onTimeUpdate = () => {
			const time = element.currentTime;
			if (element.paused || element.seeking) {
				return;
			}
			const bucket = Math.floor(time / BucketSeconds);
			if (time < furthestRef.current - ReplayMarginSeconds) {
				if (bucket !== countedBucket) {
					counts[bucket] = (counts[bucket] ?? 0) + 1;
					countedBucket = bucket;
				}
			} else {
				countedBucket = null;
			}
			furthestRef.current = Math.max(furthestRef.current, time);
		};
		// A seek starts a new pass, so the bucket it lands in counts again.
		const onSeeking = () => {
			countedBucket = null;
		};

		const send = async (): Promise<void> => {
			const ranges = readPlayedRanges(element);
			const position = element.currentTime;
			const replay: ReplayReport = { sessionId, counts: [...counts].map((count) => count ?? 0) };
			const key = JSON.stringify({ ranges, position, counts: replay.counts });
			if (ranges.length === 0 || key === lastSaved) {
				return;
			}
			if (sending) {
				sendAgain = true;
				return;
			}
			sending = true;
			try {
				if (await reportRef.current(ranges, position, replay)) {
					lastSaved = key;
				}
			} catch (error) {
				console.error('Watch progress could not be saved', error);
			} finally {
				sending = false;
				if (sendAgain) {
					sendAgain = false;
					void send();
				}
			}
		};

		const onStop = () => void send();
		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				void send();
			}
		};
		const timer = setInterval(() => {
			if (!element.paused) {
				void send();
			}
		}, ReportIntervalMs);
		element.addEventListener('pause', onStop);
		element.addEventListener('ended', onStop);
		element.addEventListener('timeupdate', onTimeUpdate);
		element.addEventListener('seeking', onSeeking);
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			clearInterval(timer);
			element.removeEventListener('pause', onStop);
			element.removeEventListener('ended', onStop);
			element.removeEventListener('timeupdate', onTimeUpdate);
			element.removeEventListener('seeking', onSeeking);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			void send();
		};
	}, [element]);
}
