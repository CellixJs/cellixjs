import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { Passport } from '../../contexts/passport.ts';
import type { PropertyPassport } from '../../contexts/property/property.passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import type { CasePassport } from '../../contexts/case/case.passport.ts';
import { GuestCommunityPassport } from './contexts/guest.community.passport.ts';
import { GuestPropertyPassport } from './contexts/guest.property.passport.ts';
import { GuestServicePassport } from './contexts/guest.service.passport.ts';
import { GuestUserPassport } from './contexts/guest.user.passport.ts';
import { GuestCasePassport } from './contexts/guest.case.passport.ts';
import { GuestPassportBase } from './guest.passport-base.ts';


export class GuestPassport extends GuestPassportBase implements Passport {
    private _communityPassport: CommunityPassport | undefined;
    private _propertyPassport: PropertyPassport | undefined;
    private _servicePassport: ServicePassport | undefined;
    private _userPassport: UserPassport | undefined;
    private _casePassport: CasePassport | undefined;

    public get case(): CasePassport {
        if (!this._casePassport) {
            this._casePassport = new GuestCasePassport();
        }
        return this._casePassport;
    }

    public get community(): CommunityPassport {
        if (!this._communityPassport) {
            this._communityPassport = new GuestCommunityPassport();
        }
        return this._communityPassport;
    }

    public get property(): PropertyPassport {
        if (!this._propertyPassport) {
            this._propertyPassport = new GuestPropertyPassport();
        }
        return this._propertyPassport;
    }

    public get service(): ServicePassport {
        if (!this._servicePassport) {
            this._servicePassport = new GuestServicePassport();
        }
        return this._servicePassport;
    }

    public get user(): UserPassport {
        if (!this._userPassport) {
            this._userPassport = new GuestUserPassport();
        }
        return this._userPassport;
    }
}
