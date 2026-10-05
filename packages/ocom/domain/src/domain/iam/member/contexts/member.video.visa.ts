import type { MemberEntityReference } from '../../../contexts/community/member/index.ts';
import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoDomainPermissions } from '../../../contexts/video/video.domain-permissions.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';

/**
 * Video permissions for a member, derived from the member's community role:
 * members who can manage site content manage videos, and every member of the
 * video's community can watch it.
 */
export class MemberVideoVisa<root extends VideoEntityReference> implements VideoVisa {
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(func: (permissions: VideoDomainPermissions) => boolean): boolean {
		if (this.member.community.id !== this.root.community.id) {
			return false;
		}

		const { communityPermissions } = this.member.role.permissions;
		const permissions: VideoDomainPermissions = {
			canManageVideos: communityPermissions.canManageSiteContent,
			canViewVideos: true,
			isSystemAccount: false,
		};

		return func(permissions);
	}
}
