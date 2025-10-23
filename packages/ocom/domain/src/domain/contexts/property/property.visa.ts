import type { PassportSeedwork } from '@cellix/domain-seedwork';
import type { PropertyDomainPermissions } from './property.domain-permissions.ts';

export interface PropertyVisa
	extends PassportSeedwork.Visa<PropertyDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<PropertyDomainPermissions>) => boolean,
	): boolean;
}
