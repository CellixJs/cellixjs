import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { CommunityPassport } from '../../../contexts/community/community.passport.ts';
import type { CommunityVisa } from '../../../contexts/community/community.visa.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestCommunityPassport
	extends GuestPassportBase
	implements CommunityPassport
{
	forCommunity(_root: CommunityEntityReference): CommunityVisa {
		return { determineIf: () => false };
	}
}
