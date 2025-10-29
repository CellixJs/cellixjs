import type { PropertyPassport } from '../../../../contexts/property/property.passport.ts';
import type { PropertyEntityReference } from '../../../../contexts/property/property/property.aggregate.ts';
import type { PropertyVisa } from '../../../../contexts/property/property.visa.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';

export class StaffUserPropertyPassport
	extends StaffUserPassportBase
	implements PropertyPassport
{
	forProperty(_root: PropertyEntityReference): PropertyVisa {
		return { determineIf: () => false };
	}
}
