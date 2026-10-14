import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import type { VideoRecordProgressInput } from '../generated.tsx';
import { type ProgressStatus, saveWatchProgress } from './save-watch-progress.ts';

const progress: VideoRecordProgressInput = { id: 'video-1', ranges: [{ start: 0, end: 15 }], position: 15 };
const withReplays = { sessionId: 'session-1', firstWatch: [0, 2], postCompletion: [] };
const withoutReplays = { sessionId: 'session-1', firstWatch: [], postCompletion: [] };

const meta: Meta = {
	title: 'Admin/Functions/saveWatchProgress',
	component: () => null,
};

export default meta;
type Story = StoryObj;

/** An API that takes replays saves the progress and the replays in one report. */
export const SavesProgressAndReplaysTogether: Story = {
	play: async () => {
		const save = fn(async (_input: VideoRecordProgressInput): Promise<ProgressStatus> => ({ success: true }));
		await expect(await saveWatchProgress(save, progress, withReplays)).toEqual({ saved: true, replaysSaved: true });
		await expect(save).toHaveBeenCalledTimes(1);
		await expect(save).toHaveBeenCalledWith({ ...progress, replaySessionId: 'session-1', replayFirstWatchCounts: [0, 2], replayPostCompletionCounts: [] });
	},
};

/** An API that rejects the replay fields still saves the progress, and the replays are left for a later report. */
export const SavesProgressWithoutReplaysWhenTheApiRejectsThem: Story = {
	play: async () => {
		const save = fn(async (input: VideoRecordProgressInput): Promise<ProgressStatus> => (input.replaySessionId ? { success: false, errorMessage: 'Field "replaySessionId" is not defined' } : { success: true }));
		await expect(await saveWatchProgress(save, progress, withReplays)).toEqual({ saved: true, replaysSaved: false });
		await expect(save).toHaveBeenCalledTimes(2);
		await expect(save).toHaveBeenLastCalledWith(progress);
	},
};

/** A report without replays sends no replay fields. */
export const SendsNoReplayFieldsWithoutReplays: Story = {
	play: async () => {
		const save = fn(async (_input: VideoRecordProgressInput): Promise<ProgressStatus> => ({ success: true }));
		await expect(await saveWatchProgress(save, progress, withoutReplays)).toEqual({ saved: true, replaysSaved: false });
		await expect(save).toHaveBeenCalledTimes(1);
		await expect(save).toHaveBeenCalledWith(progress);
	},
};

/** When even the progress cannot be saved, the API's reason is passed back. */
export const ReportsWhyProgressWasNotSaved: Story = {
	play: async () => {
		const save = fn(async (_input: VideoRecordProgressInput): Promise<ProgressStatus> => ({ success: false, errorMessage: 'Video not found' }));
		await expect(await saveWatchProgress(save, progress, withoutReplays)).toEqual({ saved: false, replaysSaved: false, errorMessage: 'Video not found' });
	},
};
