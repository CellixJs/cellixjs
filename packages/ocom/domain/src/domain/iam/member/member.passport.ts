import type { CasePassport } from '../../contexts/case/case.passport.ts';
import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { Passport } from '../../contexts/passport.ts';
import type { PropertyPassport } from '../../contexts/property/property.passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import { MemberCasePassport } from './contexts/member.case.passport.ts';
import { MemberCommunityPassport } from './contexts/member.community.passport.ts';
import { MemberPropertyPassport } from './contexts/member.property.passport.ts';
import { MemberServicePassport } from './contexts/member.service.passport.ts';
import { MemberUserPassport } from './contexts/member.user.passport.ts';
import { MemberPassportBase } from './member.passport-base.ts';

export class MemberPassport extends MemberPassportBase implements Passport {
	private _casePassport: CasePassport | undefined;
	private _communityPassport: CommunityPassport | undefined;
	private _propertyPassport: PropertyPassport | undefined;
	private _servicePassport: ServicePassport | undefined;
	private _userPassport: UserPassport | undefined;

	public get case(): CasePassport {
		if (!this._casePassport) {
			this._casePassport = new MemberCasePassport(
				this._user,
				this._member,
				this._community,
			);
		}
		return this._casePassport;
	}

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

	public get property(): PropertyPassport {
		if (!this._propertyPassport) {
			this._propertyPassport = new MemberPropertyPassport(
				this._user,
				this._member,
				this._community,
			);
		}
		return this._propertyPassport;
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
