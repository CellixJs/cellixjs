import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../../passport.ts';
import type {
	VendorUserRole,
	VendorUserRoleProps,
} from './vendor-user-role.ts';
import type { VendorUserRoleRepository } from './vendor-user-role.repository.ts';

export interface VendorUserRoleUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		VendorUserRoleProps,
		VendorUserRole<VendorUserRoleProps>,
		VendorUserRoleRepository<VendorUserRoleProps>
	> {}
