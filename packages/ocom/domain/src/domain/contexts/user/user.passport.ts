import type { UserVisa } from './user.visa.ts';
import type { EndUserEntityReference } from './end-user/end-user.ts';
import type { StaffUserEntityReference } from './staff-user/staff-user.ts';
import type { VendorUserEntityReference } from './vendor-user/vendor-user.ts';
import type { StaffRoleEntityReference } from './staff-role/staff-role.ts';

export interface UserPassport {
	forEndUser(root: EndUserEntityReference): UserVisa;
	forStaffUser(root: StaffUserEntityReference): UserVisa;
	forStaffRole(root: StaffRoleEntityReference): UserVisa;
	forVendorUser(root: VendorUserEntityReference): UserVisa;
}
