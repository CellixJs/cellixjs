import type { EndUserEntityReference } from '../../../../contexts/user/end-user/index.ts';
import type { StaffRoleEntityReference } from '../../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/index.ts';
import type { UserDomainPermissions } from '../../../../contexts/user/user.domain-permissions.ts';
import type { UserPassport } from '../../../../contexts/user/user.passport.ts';
import type { UserVisa } from '../../../../contexts/user/user.visa.ts';
import type { VendorUserEntityReference } from '../../../../contexts/user/vendor-user/vendor-user.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';

export class StaffUserUserPassport extends StaffUserPassportBase implements UserPassport {
	forEndUser(_root: EndUserEntityReference): UserVisa {
		const permissions = this.buildPermissions();
		return { determineIf: (func) => func(permissions) };
	}

	forStaffUser(root: StaffUserEntityReference): UserVisa {
		const permissions = this.buildPermissions(root);
		return { determineIf: (func) => func(permissions) };
	}

	forStaffRole(_root: StaffRoleEntityReference): UserVisa {
		const permissions = this.buildPermissions();
		return { determineIf: (func) => func(permissions) };
	}

	forVendorUser(_root: VendorUserEntityReference): UserVisa {
		const permissions = this.buildPermissions();
		return { determineIf: (func) => func(permissions) };
	}

	private buildPermissions(root?: StaffUserEntityReference): UserDomainPermissions {
		const canManageStaffRolesAndPermissions = this._user.role?.permissions.communityPermissions.canManageStaffRolesAndPermissions ?? false;
		return {
			canManageEndUsers: false,
			canManageStaffRolesAndPermissions,
			canManageStaffUsers: canManageStaffRolesAndPermissions,
			canManageVendorUsers: false,
			isEditingOwnAccount: root !== undefined && root.externalId === this._user.externalId,
			isSystemAccount: false,
		};
	}
}
