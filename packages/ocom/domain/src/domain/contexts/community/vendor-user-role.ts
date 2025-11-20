/**
 * Vendor User Role Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { VendorUserRoleRepository } from './role/vendor-user-role/vendor-user-role.repository.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	VendorUserRole,
	type VendorUserRoleEntityReference,
	type VendorUserRoleProps,
} from './role/vendor-user-role/vendor-user-role.ts';
export type { VendorUserRoleUnitOfWork } from './role/vendor-user-role/vendor-user-role.uow.ts';
export {
	VendorUserRoleCommunityPermissions,
	type VendorUserRoleCommunityPermissionsEntityReference,
	type VendorUserRoleCommunityPermissionsProps,
} from './role/vendor-user-role/vendor-user-role-community-permissions.ts';
export {
	VendorUserRolePermissions,
	type VendorUserRolePermissionsEntityReference,
	type VendorUserRolePermissionsProps,
} from './role/vendor-user-role/vendor-user-role-permissions.ts';
export {
	VendorUserRolePropertyPermissions,
	type VendorUserRolePropertyPermissionsEntityReference,
	type VendorUserRolePropertyPermissionsProps,
} from './role/vendor-user-role/vendor-user-role-property-permissions.ts';
export {
	VendorUserRoleServicePermissions,
	type VendorUserRoleServicePermissionsEntityReference,
	type VendorUserRoleServicePermissionsProps,
} from './role/vendor-user-role/vendor-user-role-service-permissions.ts';
export {
	VendorUserRoleServiceTicketPermissions,
	type VendorUserRoleServiceTicketPermissionsEntityReference,
	type VendorUserRoleServiceTicketPermissionsProps,
} from './role/vendor-user-role/vendor-user-role-service-ticket-permissions.ts';
export {
	VendorUserRoleViolationTicketPermissions,
	type VendorUserRoleViolationTicketPermissionsEntityReference,
	type VendorUserRoleViolationTicketPermissionsProps,
} from './role/vendor-user-role/vendor-user-role-violation-ticket-permissions.ts';

//#region Exports
// All exports are above
//#endregion Exports
