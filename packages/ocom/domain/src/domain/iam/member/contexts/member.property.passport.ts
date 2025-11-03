import type { PropertyPassport } from '../../../contexts/property/property.passport.ts';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberPropertyVisa } from './member.property.visa.ts';

export class MemberPropertyPassport
	extends MemberPassportBase
	implements PropertyPassport
{
	forProperty(root: PropertyEntityReference) {
		return new MemberPropertyVisa(root, this._member);
	}
}
