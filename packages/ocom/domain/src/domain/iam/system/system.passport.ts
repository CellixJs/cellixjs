import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { Passport } from '../../contexts/passport.ts';
import type { PropertyPassport } from '../../contexts/property/property.passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import { SystemCommunityPassport } from './contexts/system.community.passport.ts';
import { SystemPropertyPassport } from './contexts/system.property.passport.ts';
import { SystemServicePassport } from './contexts/system.service.passport.ts';
import { SystemUserPassport } from './contexts/system.user.passport.ts';
import { SystemPassportBase } from './system.passport-base.ts';

export class SystemPassport extends SystemPassportBase implements Passport {
    private _communityPassport: CommunityPassport | undefined;
    private _propertyPassport: PropertyPassport | undefined;
    private _servicePassport: ServicePassport | undefined;
    private _userPassport: UserPassport | undefined;

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
