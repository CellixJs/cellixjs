import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/staff-user.ts';
import type { VideoEntityReference } from '../../../../contexts/video/video/index.ts';
import type { VideoDomainPermissions } from '../../../../contexts/video/video.domain-permissions.ts';
import type { VideoVisa } from '../../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../../contexts/video/video-viewing/index.ts';

/**
 * Video permissions for a staff user, from the staff role's tech-admin
 * permissions: `canEncodeVideos` lets staff encode any community's videos and
 * preview the result. Staff do not upload or manage community videos, and
 * do not watch them as members, so they never record or see video viewings.
 */
export class StaffUserVideoVisa<root extends VideoEntityReference | VideoViewingEntityReference> implements VideoVisa {
	private readonly user: StaffUserEntityReference;

	/** The video is not consulted: staff permissions apply to every community's videos. */
	constructor(_root: root, user: StaffUserEntityReference) {
		this.user = user;
	}

	determineIf(func: (permissions: VideoDomainPermissions) => boolean): boolean {
		if (!this.user.role) {
			return false;
		}
		const canEncodeVideos = this.user.role.permissions.techAdminPermissions.canEncodeVideos === true;
		return func({
			canManageVideos: false,
			canEncodeVideos,
			canViewVideos: canEncodeVideos,
			isOwnVideoViewing: false,
			isSystemAccount: false,
		});
	}
}
