import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { Passport } from '../../contexts/passport.ts';
import type { PropertyPassport } from '../../contexts/property/property.passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import type { CasePassport } from '../../contexts/case/case.passport.ts';
import { SystemCommunityPassport } from './contexts/system.community.passport.ts';
import { SystemPropertyPassport } from './contexts/system.property.passport.ts';
import { SystemServicePassport } from './contexts/system.service.passport.ts';
import { SystemUserPassport } from './contexts/system.user.passport.ts';
import { SystemCasePassport } from './contexts/system.case.passport.ts';
import { SystemPassportBase } from './system.passport-base.ts';

export class SystemPassport extends SystemPassportBase implements Passport {
    private _communityPassport: CommunityPassport | undefined;
    private _propertyPassport: PropertyPassport | undefined;
    private _servicePassport: ServicePassport | undefined;
    private _userPassport: UserPassport | undefined;
    private _casePassport: CasePassport | undefined;

    public get case(): CasePassport {
        if (!this._casePassport) {
            this._casePassport = new SystemCasePassport(this.permissions);
        }
        return this._casePassport;
    }

    public get community(): CommunityPassport {
        if (!this._communityPassport) {
            this._communityPassport = new SystemCommunityPassport(this.permissions);
        }
        return this._communityPassport;
    }

    public get property(): PropertyPassport {
        if (!this._propertyPassport) {
            this._propertyPassport = new SystemPropertyPassport(this.permissions);
        }
        return this._propertyPassport;
    }

    public get service(): ServicePassport {
        if (!this._servicePassport) {
            this._servicePassport = new SystemServicePassport(this.permissions);
        }
        return this._servicePassport;
        
    }

    public get user(): UserPassport {
        if (!this._userPassport) {
            this._userPassport = new SystemUserPassport(this.permissions);
        }
        return this._userPassport;
    }
}
