import type { CasePassport } from '../../../contexts/case/case.passport.ts';
import type { CommunityPassport } from '../../../contexts/community/community.passport.ts';
import type { Passport } from '../../../contexts/passport.ts';
import type { PropertyPassport } from '../../../contexts/property/property.passport.ts';
import type { UserPassport } from '../../../contexts/user/user.passport.ts';
import { StaffUserPassportBase } from '../staff-user.passport-base.ts';
import { StaffUserCasePassport } from './contexts/staff-user.case.passport.ts';
import { StaffUserCommunityPassport } from './contexts/staff-user.community.passport.ts';
import { StaffUserPropertyPassport } from './contexts/staff-user.property.passport.ts';
import { StaffUserUserPassport } from './contexts/staff-user.user.passport.ts';

export class StaffUserPassport extends StaffUserPassportBase implements Passport {
	private _communityPassport: CommunityPassport | undefined;
	private _propertyPassport: PropertyPassport | undefined;
	private _casePassport: CasePassport | undefined;
	private _userPassport: UserPassport | undefined;

	public get case(): CasePassport {
		if (!this._casePassport) {
			this._casePassport = new StaffUserCasePassport(this._user);
		}
		return this._casePassport;
	}

	public get community(): CommunityPassport {
		if (!this._communityPassport) {
			this._communityPassport = new StaffUserCommunityPassport(this._user);
		}
		return this._communityPassport;
	}

	public get property(): PropertyPassport {
		if (!this._propertyPassport) {
			this._propertyPassport = new StaffUserPropertyPassport(this._user);
		}
		return this._propertyPassport;
	}

	public get service(): never {
		throw new Error('Service passport is not available for StaffUserPassport');
	}

	public get user(): UserPassport {
		if (!this._userPassport) {
			this._userPassport = new StaffUserUserPassport(this._user);
		}
		return this._userPassport;
	}
}
