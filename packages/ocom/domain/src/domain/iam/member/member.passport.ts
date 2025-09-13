import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { Passport } from '../../contexts/passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import { MemberCommunityPassport } from './contexts/member.community.passport.ts';
import { MemberServicePassport } from './contexts/member.service.passport.ts';
import { MemberUserPassport } from './contexts/member.user.passport.ts';
import { MemberPassportBase } from './member.passport-base.ts';

export class MemberPassport extends MemberPassportBase implements Passport {
	private _communityPassport: CommunityPassport | undefined;
	private _servicePassport: ServicePassport | undefined;
	private _userPassport: UserPassport | undefined;

	public get community(): CommunityPassport {
		if (!this._communityPassport) {
			this._communityPassport = new MemberCommunityPassport(
				this._user,
				this._member,
				this._community,
			);
		}
		return this._communityPassport;
	}

	public get service(): ServicePassport {
		if (!this._servicePassport) {
			this._servicePassport = new MemberServicePassport(
				this._user,
				this._member,
				this._community,
			);
		}
		return this._servicePassport;
	}

	public get user(): UserPassport {
		if (!this._userPassport) {
			this._userPassport = new MemberUserPassport(
				this._user,
				this._member,
				this._community,
			);
		}
		return this._userPassport;
	}
}
