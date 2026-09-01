import type { PropertyAuthorizationSubject, PropertyPassport } from '../../../contexts/property/property.passport.ts';
import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestPropertyPassport extends GuestPassportBase implements PropertyPassport {
	forProperty(_root: PropertyAuthorizationSubject): PropertyVisa {
		return { determineIf: () => false };
	}
}
