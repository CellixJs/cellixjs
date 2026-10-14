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

/** A span of the video the member has not played yet, in seconds. */
export interface UnwatchedRange {
	start: number;
	end: number;
}

/** Whether a part of the video was played before this session, from the member's viewing. */
function playedBeforeThisSession(unwatched: readonly UnwatchedRange[] | undefined, bucket: number): boolean {
	if (!unwatched) {
		return false;
	}
	const start = bucket * BucketSeconds;
	const end = start + BucketSeconds;
	// A part counts as played before unless an unwatched span covers its middle.
	const middle = (start + end) / 2;
	return !unwatched.some((range) => middle >= range.start && middle < range.end);
}

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
 * @param unwatched - Spans the member has not played yet, from their viewing. Parts outside them were played in an earlier sitting, so playing them again is a replay. Omit before the viewing is known.
 */
export function useWatchProgressReporter(element: HTMLVideoElement | undefined, report: (ranges: PlayedRange[], position: number, replay: ReplayReport) => Promise<boolean>, unwatched?: readonly UnwatchedRange[]): void {
	const reportRef = useRef(report);
	reportRef.current = report;
	const unwatchedRef = useRef(unwatched);
	// Kept until the viewing loads, then fixed, so later reports do not shrink what counts as already played.
	if (unwatched && !unwatchedRef.current) {
		unwatchedRef.current = unwatched;
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
		// A pass is the playing between two seeks. Parts reached in an earlier pass, or an earlier sitting, are replays when reached again.
		const playedInEarlierPasses = new Set<number>();
		// Parts reached in this pass. A part counts once per pass, however often the playhead crosses into it.
		const reachedThisPass = new Set<number>();

		const onTimeUpdate = () => {
			if (element.paused || element.seeking) {
				return;
			}
			const bucket = Math.floor(element.currentTime / BucketSeconds);
			if (reachedThisPass.has(bucket)) {
				return;
			}
			reachedThisPass.add(bucket);
			// A part reached for the first time is not a replay, so skipping ahead and playing a new part does not count.
			if (playedInEarlierPasses.has(bucket) || playedBeforeThisSession(unwatchedRef.current, bucket)) {
				counts[bucket] = (counts[bucket] ?? 0) + 1;
			}
		};
		// A seek ends the pass: what it reached becomes earlier play, and the next pass starts empty.
		const onSeeking = () => {
			for (const bucket of reachedThisPass) {
				playedInEarlierPasses.add(bucket);
			}
			reachedThisPass.clear();
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
