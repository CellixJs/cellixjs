import type { PropertyAuthorizationSubject, PropertyPassport } from '../../../../contexts/property/property.passport.ts';
import type { PropertyVisa } from '../../../../contexts/property/property.visa.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';

export class StaffUserPropertyPassport extends StaffUserPassportBase implements PropertyPassport {
	forProperty(_root: PropertyAuthorizationSubject): PropertyVisa {
		return { determineIf: () => false };
	}
}
