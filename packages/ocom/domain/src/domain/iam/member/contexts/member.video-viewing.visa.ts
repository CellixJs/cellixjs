import type { MemberEntityReference } from '../../../contexts/community/member/index.ts';
import type { VideoDomainPermissions } from '../../../contexts/video/video.domain-permissions.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../contexts/video/video-viewing/index.ts';

/**
 * Video permissions for a member looking at a video viewing: the member may
 * record and see their own viewing, and members who can manage site content
 * may see everyone's viewings in their community.
 */
export class MemberVideoViewingVisa<root extends VideoViewingEntityReference> implements VideoVisa {
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(func: (permissions: VideoDomainPermissions) => boolean): boolean {
		if (this.member.community.id !== this.root.communityId) {
			return false;
		}

		const { communityPermissions } = this.member.role.permissions;
		return func({
			canManageVideos: communityPermissions.canManageSiteContent,
			canEncodeVideos: false,
			canViewVideos: true,
			isOwnVideoViewing: this.root.memberId === this.member.id,
			isSystemAccount: false,
		});
	}
}
