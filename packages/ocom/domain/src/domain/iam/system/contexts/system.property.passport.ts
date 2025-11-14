import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { PropertyDomainPermissions } from '../../../contexts/property/property.domain-permissions.ts';
import type { PropertyPassport } from '../../../contexts/property/property.passport.ts';
import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import { SystemPassportBase } from '../system.passport-base.ts';

export class SystemPropertyPassport
	extends SystemPassportBase
	implements PropertyPassport
{
	forProperty(_root: PropertyEntityReference): PropertyVisa {
		const permissions = this.permissions as PropertyDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}
}
