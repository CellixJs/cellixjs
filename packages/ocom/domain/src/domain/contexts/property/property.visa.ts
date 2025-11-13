import type * as PassportSeedwork from '@cellix/domain-seedwork/passport-seedwork';
import type { PropertyDomainPermissions } from './property.domain-permissions.ts';

export interface PropertyVisa
	extends PassportSeedwork.Visa<PropertyDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<PropertyDomainPermissions>) => boolean,
	): boolean;
}
