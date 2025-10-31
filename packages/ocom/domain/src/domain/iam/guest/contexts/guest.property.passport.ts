import type { PropertyPassport } from '../../../contexts/property/property.passport.ts';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestPropertyPassport
	extends GuestPassportBase
	implements PropertyPassport
{
	forProperty(_root: PropertyEntityReference): PropertyVisa {
		return { determineIf: () => false };
	}
}
