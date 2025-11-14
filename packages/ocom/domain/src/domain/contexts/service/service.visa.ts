import type { Visa } from '@cellix/domain-seedwork/visa';
import type { ServiceDomainPermissions } from './service.domain-permissions.ts';

export interface ServiceVisa
	extends Visa<ServiceDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<ServiceDomainPermissions>) => boolean,
	): boolean;
}
