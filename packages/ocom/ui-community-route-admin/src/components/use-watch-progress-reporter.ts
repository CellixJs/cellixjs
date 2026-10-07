import { useEffect, useRef } from 'react';

/** A span of the video that was played, in seconds. */
export interface PlayedRange {
	start: number;
	end: number;
}

/** How often to report while the video is playing. */
const ReportIntervalMs = 15_000;

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
 * Reports what a video element has played: every 15 seconds while it plays,
 * and when it pauses, ends, the page is hidden, or the component unmounts.
 * Each report sends everything played so far; the API ignores spans it has
 * already counted, so a report that fails is covered by the next one.
 *
 * @param element - The player's video element, once the player is ready.
 * @param report - Sends the played spans. Resolves to whether they were saved.
 */
export function useWatchProgressReporter(element: HTMLVideoElement | undefined, report: (ranges: PlayedRange[]) => Promise<boolean>): void {
	const reportRef = useRef(report);
	reportRef.current = report;

	useEffect(() => {
		if (!element) {
			return;
		}
		let lastSaved = '';
		let sending = false;
		let sendAgain = false;

		const send = async (): Promise<void> => {
			const ranges = readPlayedRanges(element);
			const key = JSON.stringify(ranges);
			if (ranges.length === 0 || key === lastSaved) {
				return;
			}
			if (sending) {
				sendAgain = true;
				return;
			}
			sending = true;
			try {
				if (await reportRef.current(ranges)) {
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
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			clearInterval(timer);
			element.removeEventListener('pause', onStop);
			element.removeEventListener('ended', onStop);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			void send();
		};
	}, [element]);
}
