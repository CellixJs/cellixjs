export interface UserDomainPermissions {
	//EndUser Aggregate Root
	canManageEndUsers: boolean;

	//StaffRole Aggregate Root
	canManageStaffRolesAndPermissions: boolean;

	//StaffUser Aggregate Root
	canManageStaffUsers: boolean;

	//VendorUser Aggregate Root
	canManageVendorUsers: boolean;

	isEditingOwnAccount: boolean;
	isSystemAccount: boolean;
}
