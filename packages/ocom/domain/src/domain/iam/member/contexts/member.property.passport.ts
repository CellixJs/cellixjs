import type { PropertyAuthorizationSubject, PropertyPassport } from '../../../contexts/property/property.passport.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberPropertyVisa } from './member.property.visa.ts';

export class MemberPropertyPassport extends MemberPassportBase implements PropertyPassport {
	forProperty(root: PropertyAuthorizationSubject) {
		return new MemberPropertyVisa(root, this._member, this._user);
	}
}
