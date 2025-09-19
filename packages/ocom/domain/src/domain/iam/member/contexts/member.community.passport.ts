import type { CommunityPassport } from '../../../contexts/community/community.passport.ts';
import type { CommunityVisa } from '../../../contexts/community/community.visa.ts';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberCommunityVisa } from './member.community.visa.ts';

export class MemberCommunityPassport
	extends MemberPassportBase
	implements CommunityPassport
{
	forCommunity(root: CommunityEntityReference): CommunityVisa {
		return new MemberCommunityVisa(root, this._member);
	}
}
