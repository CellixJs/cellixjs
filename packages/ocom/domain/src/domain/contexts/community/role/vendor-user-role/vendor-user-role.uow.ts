import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../../passport.ts';
import type { VendorUserRoleRepository } from './vendor-user-role.repository.ts';
import type {
	VendorUserRole,
	VendorUserRoleProps,
} from './vendor-user-role.ts';

export interface VendorUserRoleUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		VendorUserRoleProps,
		VendorUserRole<VendorUserRoleProps>,
		VendorUserRoleRepository<VendorUserRoleProps>
	> {}
