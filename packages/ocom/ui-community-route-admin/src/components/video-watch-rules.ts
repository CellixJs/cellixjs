import type { AdminVideosDetailContainerViewingFieldsFragment } from '../generated.tsx';

type Viewing = Pick<AdminVideosDetailContainerViewingFieldsFragment, 'durationSeconds' | 'completedAt' | 'unwatched' | 'lastPositionSeconds'>;

/** Members who stopped this close to the end start over instead of being asked to resume. */
const ResumeEndMarginSeconds = 5;

/**
 * How far a member's first watch has reached: the start of the first part they
 * have not watched yet, or 0 before they start.
 */
function checkpointOf(viewing: Viewing | null | undefined): number {
	if (!viewing) {
		return 0;
	}
	return viewing.unwatched[0]?.start ?? viewing.durationSeconds;
}

interface SeekLimitOptions {
	/** The member's viewing: `null` before they start, `undefined` while it loads or if it cannot be loaded. */
	viewing: Viewing | null | undefined;
	/** Whether the member manages the community's videos. */
	canManage: boolean;
	/** Whether a manager is trying the page as a member would see it. */
	testAsMember: boolean;
}

/**
 * The furthest point a member may seek to, or `undefined` when they may seek
 * anywhere. Members can only skip ahead to where they have watched until they
 * have watched the whole video once. Managers are not limited, unless they
 * are testing the page as a member: then a video they have already watched
 * starts over, so they can try the limit again.
 */
export function seekLimitFor({ viewing, canManage, testAsMember }: SeekLimitOptions): number | undefined {
	if (canManage && !testAsMember) {
		return undefined;
	}
	if (viewing?.completedAt) {
		return canManage ? 0 : undefined;
	}
	return checkpointOf(viewing);
}

/**
 * Where a member can pick up the video, or `undefined` when there is nothing
 * to resume: they have not started, or stopped at the start or near the end.
 * This is where their player last was, even if they had gone back to rewatch
 * a part. Viewings saved before positions were recorded resume at the
 * checkpoint of an unfinished first watch.
 *
 * @param seekLimit - The member's seek limit from {@link seekLimitFor}. The resume point is never past it.
 */
export function resumePointFor(viewing: Viewing | null | undefined, seekLimit: number | undefined): number | undefined {
	if (!viewing) {
		return undefined;
	}
	const stoppedAt = viewing.lastPositionSeconds ?? (viewing.completedAt ? 0 : checkpointOf(viewing));
	const position = seekLimit === undefined ? stoppedAt : Math.min(stoppedAt, seekLimit);
	return position > 0 && position < viewing.durationSeconds - ResumeEndMarginSeconds ? position : undefined;
}
