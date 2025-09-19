import type { CommunityPassport } from '../../../../contexts/community/community.passport.ts';
import type { CommunityVisa } from '../../../../contexts/community/community.visa.ts';
import type { CommunityEntityReference } from '../../../../contexts/community/community/community.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';
import { StaffUserCommunityVisa } from './staff-user.community.visa.ts';

export class StaffUserCommunityPassport
	extends StaffUserPassportBase
	implements CommunityPassport
{
	forCommunity(root: CommunityEntityReference): CommunityVisa {
		return new StaffUserCommunityVisa(root, this._user);
	}
}
