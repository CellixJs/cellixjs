import type { PassportSeedwork } from '@cellix/domain-seedwork';
import type { ServiceDomainPermissions } from './service.domain-permissions.ts';

export interface ServiceVisa
	extends PassportSeedwork.Visa<ServiceDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<ServiceDomainPermissions>) => boolean,
	): boolean;
}
