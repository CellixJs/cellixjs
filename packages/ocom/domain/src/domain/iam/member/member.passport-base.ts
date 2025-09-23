import type { CommunityEntityReference } from '../../contexts/community/community/community.ts';
import type { MemberEntityReference } from '../../contexts/community/member/member.ts';
import type { EndUserEntityReference } from '../../contexts/user/end-user/end-user.ts';

export abstract class MemberPassportBase {
	protected readonly _user: EndUserEntityReference;
	protected readonly _member: MemberEntityReference;
	protected readonly _community: CommunityEntityReference;

	constructor(
		user: EndUserEntityReference,
		member: MemberEntityReference,
		community: CommunityEntityReference,
	) {
		if (!user) {
		  throw new Error("User is required");
		}
		if (!member.accounts.find((account) => account.user.id === user.id)) {
			throw new Error(
				`User ${user.id} is not a member of the community ${member.community.id}`,
			);
		}
		if (member.community.id !== community.id) {
			throw new Error(
				`Member ${member.id} is not part of the community ${community.id}`,
			);
		}

		this._user = user;
		this._member = member;
		this._community = community;
	}
}
