import type { Visa } from '@cellix/domain-seedwork/visa';
import type { PropertyDomainPermissions } from './property.domain-permissions.ts';

export interface PropertyVisa extends Visa<PropertyDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<PropertyDomainPermissions>) => boolean,
	): boolean;
}
