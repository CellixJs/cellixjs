import { useEffect, useRef } from 'react';

/** A span of the video that was played, in seconds. */
export interface PlayedRange {
	start: number;
	end: number;
}

/**
 * Replay counts a playback session has reached, by bucket index, split by
 * whether the member had finished the video when each replay happened.
 */
export interface ReplayReport {
	sessionId: string;
	firstWatch: number[];
	postCompletion: number[];
}

/** A span of the video the member has not played yet, in seconds. */
interface UnwatchedRange {
	start: number;
	end: number;
}

/** What the member had watched of the video before this session. */
export interface WatchHistory {
	/** Spans not played yet, or `null` when the member has never watched the video. */
	unwatched: readonly UnwatchedRange[] | null;
	/** Whether the member has finished the video. */
	completed: boolean;
}

/** How often to report while the video is playing. */
const ReportIntervalMs = 15_000;

/** Delays between reports. Tests shorten them; the app uses `DefaultReporterTiming`. */
export interface ReporterTiming {
	/** How long after a failed report to try again; doubles with each failure up to `maxRetryMs`. */
	firstRetryMs: number;
	maxRetryMs: number;
	/**
	 * How long after playback stops to send the replay counts once more. The API
	 * credits replays no faster than real time, so counts it could not credit yet
	 * are credited by this later report.
	 */
	trailingReportMs: number;
}

const DefaultReporterTiming: ReporterTiming = { firstRetryMs: 5_000, maxRetryMs: 60_000, trailingReportMs: 30_000 };

/** Length of one bucket of the video's timeline, matching the domain's buckets. */
const BucketSeconds = 5;

/**
 * Whether a part of the video was played before this session. The viewing's
 * unwatched spans start and end on part boundaries, so a part was played unless
 * an unwatched span covers its start; its start is inside the video even when
 * the last part is shorter than the others.
 */
function playedBeforeThisSession(unwatched: readonly UnwatchedRange[] | null, bucket: number): boolean {
	if (!unwatched) {
		return false;
	}
	const start = bucket * BucketSeconds;
	return !unwatched.some((range) => start >= range.start && start < range.end);
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

const hasReplays = (replay: ReplayReport): boolean => replay.firstWatch.some((count) => count > 0) || replay.postCompletion.some((count) => count > 0);

const dense = (counts: number[]): number[] => Array.from(counts, (count) => count ?? 0);

/**
 * Reports what a video element has played, and where its playhead is: every
 * 15 seconds while it plays, and when it pauses, ends, the page is hidden, or
 * the component unmounts. Each report sends everything played so far; the API
 * ignores spans it has already counted, so a report that fails is sent again
 * after a delay, and any later report covers it too. The position lets the
 * member resume where they stopped.
 *
 * It also counts replays: a part counts when the playhead reaches it again
 * after a seek, or reaches a part an earlier sitting played, at most once per
 * pass. Each replay is counted as a first watch or a return visit by whether
 * the member had finished the video at that moment.
 *
 * @param element - The player's video element, once the player is ready and the viewing is known.
 * @param report - Sends the played spans, the playhead's position in seconds, and the session's replay counts. Resolves to whether they were all saved.
 * @param history - What the member had watched before. Read once for what counts as played before; `completed` is followed as it changes.
 * @param timing - Delays between reports; leave out to use the app's.
 */
export function useWatchProgressReporter(
	element: HTMLVideoElement | undefined,
	report: (ranges: PlayedRange[], position: number, replay: ReplayReport) => Promise<boolean>,
	history?: WatchHistory,
	timing: ReporterTiming = DefaultReporterTiming,
): void {
	const reportRef = useRef(report);
	reportRef.current = report;
	const timingRef = useRef(timing);
	timingRef.current = timing;
	// Fixed when first known, so this session's own reports, which shrink the unwatched spans, are not mistaken for an earlier sitting.
	const unwatchedRef = useRef<{ known: boolean; unwatched: readonly UnwatchedRange[] | null }>({ known: false, unwatched: null });
	if (!unwatchedRef.current.known && history) {
		unwatchedRef.current = { known: true, unwatched: history.unwatched };
	}
	// Followed as it changes, so a replay after the member finishes the video counts as a return visit.
	const completedRef = useRef(false);
	if (history?.completed) {
		completedRef.current = true;
	}

	useEffect(() => {
		if (!element) {
			return;
		}
		let lastSaved = '';
		let sending = false;
		let sendAgain = false;
		let followUp: ReturnType<typeof setTimeout> | undefined;
		let retryMs = timingRef.current.firstRetryMs;
		// Set once the reporter is torn down, so a report that fails on the way out is not retried by a timer left behind.
		let disposed = false;
		const sessionId = crypto.randomUUID();
		const firstWatch: number[] = [];
		const postCompletion: number[] = [];
		// A pass is the playing between two seeks. Parts reached in an earlier pass, or an earlier sitting, are replays when reached again.
		const playedInEarlierPasses = new Set<number>();
		// Parts reached in this pass. A part counts once per pass, however often the playhead crosses into it.
		const reachedThisPass = new Set<number>();
		// Whatever played before the reporter started belongs to the current pass, so going back to it after a seek is a replay.
		for (const range of readPlayedRanges(element)) {
			for (let bucket = Math.floor(range.start / BucketSeconds); bucket < Math.ceil(range.end / BucketSeconds); bucket++) {
				reachedThisPass.add(bucket);
			}
		}

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
			if (playedInEarlierPasses.has(bucket) || playedBeforeThisSession(unwatchedRef.current.unwatched, bucket)) {
				const tally = completedRef.current ? postCompletion : firstWatch;
				tally[bucket] = (tally[bucket] ?? 0) + 1;
			}
		};
		// A seek ends the pass: what it reached becomes earlier play, and the next pass starts empty.
		const onSeeking = () => {
			for (const bucket of reachedThisPass) {
				playedInEarlierPasses.add(bucket);
			}
			reachedThisPass.clear();
		};

		const scheduleFollowUp = (delayMs: number) => {
			if (disposed) {
				return;
			}
			clearTimeout(followUp);
			followUp = setTimeout(() => {
				followUp = undefined;
				void send(true);
			}, delayMs);
		};

		/** Sends a report unless nothing changed since the last saved one, or `force` asks to send it anyway. Resolves to whether one was saved. */
		const send = async (force = false): Promise<boolean> => {
			const ranges = readPlayedRanges(element);
			const position = element.currentTime;
			const replay: ReplayReport = { sessionId, firstWatch: dense(firstWatch), postCompletion: dense(postCompletion) };
			const key = JSON.stringify({ ranges, position, replay });
			if (ranges.length === 0 || (!force && key === lastSaved)) {
				return false;
			}
			if (sending) {
				sendAgain = true;
				return false;
			}
			sending = true;
			clearTimeout(followUp);
			followUp = undefined;
			let saved = false;
			try {
				saved = await reportRef.current(ranges, position, replay);
			} catch (error) {
				console.error('Watch progress could not be saved', error);
			} finally {
				sending = false;
			}
			if (saved) {
				lastSaved = key;
				retryMs = timingRef.current.firstRetryMs;
			} else {
				// Tried again after a delay, so a report that fails while playback is stopped is not left unsent.
				scheduleFollowUp(retryMs);
				retryMs = Math.min(retryMs * 2, timingRef.current.maxRetryMs);
			}
			if (sendAgain) {
				sendAgain = false;
				return await send();
			}
			return saved;
		};

		const onStop = async () => {
			const saved = await send();
			if (saved && followUp === undefined && hasReplays({ sessionId, firstWatch, postCompletion })) {
				scheduleFollowUp(timingRef.current.trailingReportMs);
			}
		};
		const onPause = () => void onStop();
		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				void onStop();
			}
		};
		const timer = setInterval(() => {
			if (!element.paused) {
				void send();
			}
		}, ReportIntervalMs);
		element.addEventListener('pause', onPause);
		element.addEventListener('ended', onPause);
		element.addEventListener('timeupdate', onTimeUpdate);
		element.addEventListener('seeking', onSeeking);
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			disposed = true;
			clearInterval(timer);
			clearTimeout(followUp);
			element.removeEventListener('pause', onPause);
			element.removeEventListener('ended', onPause);
			element.removeEventListener('timeupdate', onTimeUpdate);
			element.removeEventListener('seeking', onSeeking);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			void send();
		};
	}, [element]);
}
