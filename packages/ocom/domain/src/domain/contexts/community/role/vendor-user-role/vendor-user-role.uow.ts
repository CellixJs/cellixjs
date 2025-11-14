import type { UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../../passport.ts';
import type {
	VendorUserRole,
	VendorUserRoleProps,
} from './vendor-user-role.ts';
import type { VendorUserRoleRepository } from './vendor-user-role.repository.ts';

export interface VendorUserRoleUnitOfWork
	extends UnitOfWork<
		Passport,
		VendorUserRoleProps,
		VendorUserRole<VendorUserRoleProps>,
		VendorUserRoleRepository<VendorUserRoleProps>
	> {}
