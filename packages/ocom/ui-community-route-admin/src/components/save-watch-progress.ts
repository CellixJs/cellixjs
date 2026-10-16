import type { VideoRecordProgressInput } from '../generated.tsx';
import type { ReplayReport } from './use-watch-progress-reporter.ts';

/** What the API answered for one progress report, or `undefined` when it gave no answer. */
export type ProgressStatus = { success: boolean; errorMessage?: string | null } | undefined;

interface SavedWatchProgress {
	/** Whether the played spans and position were saved. */
	saved: boolean;
	/** Whether the replay counts were saved too; false when there were none, or the API could only take the progress. */
	replaysSaved: boolean;
	/** Why the progress could not be saved, when it could not. */
	errorMessage?: string | null | undefined;
}

const hasReplays = (replay: ReplayReport): boolean => replay.firstWatch.some((count) => count > 0) || replay.postCompletion.some((count) => count > 0);

/**
 * Saves a progress report with its replay counts. Replay fields are sent only
 * when there are replays, so most reports stay readable by an API that
 * predates them; when the API rejects a report that carries replays, the
 * progress is saved without them, and the replays go with a later report.
 *
 * @param save - Sends one report and resolves to the API's answer. It must not throw.
 */
export async function saveWatchProgress(save: (input: VideoRecordProgressInput) => Promise<ProgressStatus>, progress: VideoRecordProgressInput, replay: ReplayReport): Promise<SavedWatchProgress> {
	if (hasReplays(replay)) {
		const withReplays = await save({ ...progress, replaySessionId: replay.sessionId, replayFirstWatchCounts: replay.firstWatch, replayPostCompletionCounts: replay.postCompletion });
		if (withReplays?.success) {
			return { saved: true, replaysSaved: true };
		}
	}
	const status = await save(progress);
	return status?.success ? { saved: true, replaysSaved: false } : { saved: false, replaysSaved: false, errorMessage: status?.errorMessage };
}
