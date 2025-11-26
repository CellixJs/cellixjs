import type { EndUserEntityReference } from '../../../contexts/user/end-user/index.ts';
import type { StaffRoleEntityReference } from '../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/index.ts';
import type { UserDomainPermissions } from '../../../contexts/user/user.domain-permissions.ts';
import type { UserPassport } from '../../../contexts/user/user.passport.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';
import type { VendorUserEntityReference } from '../../../contexts/user/vendor-user/vendor-user.ts';
import { SystemPassportBase } from '../system.passport-base.ts';

export class SystemUserPassport
	extends SystemPassportBase
	implements UserPassport
{
	forEndUser(_root: EndUserEntityReference): UserVisa {
		// biome-ignore lint/plugin/no-type-assertion: test file
		const permissions = this.permissions as UserDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}

	forStaffUser(_root: StaffUserEntityReference): UserVisa {
		// biome-ignore lint/plugin/no-type-assertion: test file
		const permissions = this.permissions as UserDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}

	forStaffRole(_root: StaffRoleEntityReference): UserVisa {
		// biome-ignore lint/plugin/no-type-assertion: test file
		const permissions = this.permissions as UserDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}

	forVendorUser(_root: VendorUserEntityReference): UserVisa {
		// biome-ignore lint/plugin/no-type-assertion: test file
		const permissions = this.permissions as UserDomainPermissions;
		return { determineIf: (func) => func(permissions) };
	}
}
