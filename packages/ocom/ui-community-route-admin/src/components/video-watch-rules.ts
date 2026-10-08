import type { AdminVideosDetailContainerViewingFieldsFragment } from '../generated.tsx';

type Viewing = Pick<AdminVideosDetailContainerViewingFieldsFragment, 'durationSeconds' | 'completedAt' | 'unwatched'>;

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

/** Where a member can pick up an unfinished first watch, or `undefined` when there is nothing to resume. */
export function resumePointFor(viewing: Viewing | null | undefined): number | undefined {
	if (!viewing || viewing.completedAt) {
		return undefined;
	}
	const checkpoint = checkpointOf(viewing);
	return checkpoint > 0 && checkpoint < viewing.durationSeconds ? checkpoint : undefined;
}
