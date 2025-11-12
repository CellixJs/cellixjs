import type * as PassportSeedwork from '@cellix/domain-seedwork/passport-seedwork';
import type { ServiceDomainPermissions } from './service.domain-permissions.ts';

export interface ServiceVisa
	extends PassportSeedwork.Visa<ServiceDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<ServiceDomainPermissions>) => boolean,
	): boolean;
}
