/**
 * End User Role Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { EndUserRoleRepository } from './role/end-user-role/end-user-role.repository.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	EndUserRole,
	type EndUserRoleEntityReference,
	type EndUserRoleProps,
} from './role/end-user-role/end-user-role.ts';
export type { EndUserRoleUnitOfWork } from './role/end-user-role/end-user-role.uow.ts';
export {
	EndUserRoleCommunityPermissions,
	type EndUserRoleCommunityPermissionsEntityReference,
	type EndUserRoleCommunityPermissionsProps,
} from './role/end-user-role/end-user-role-community-permissions.ts';
export {
	EndUserRolePermissions,
	type EndUserRolePermissionsEntityReference,
	type EndUserRolePermissionsProps,
} from './role/end-user-role/end-user-role-permissions.ts';
export {
	EndUserRolePropertyPermissions,
	type EndUserRolePropertyPermissionsEntityReference,
	type EndUserRolePropertyPermissionsProps,
} from './role/end-user-role/end-user-role-property-permissions.ts';
export {
	EndUserRoleServicePermissions,
	type EndUserRoleServicePermissionsEntityReference,
	type EndUserRoleServicePermissionsProps,
} from './role/end-user-role/end-user-role-service-permissions.ts';
export {
	EndUserRoleServiceTicketPermissions,
	type EndUserRoleServiceTicketPermissionsEntityReference,
	type EndUserRoleServiceTicketPermissionsProps,
} from './role/end-user-role/end-user-role-service-ticket-permissions.ts';
export {
	EndUserRoleViolationTicketPermissions,
	type EndUserRoleViolationTicketPermissionsEntityReference,
	type EndUserRoleViolationTicketPermissionsProps,
} from './role/end-user-role/end-user-role-violation-ticket-permissions.ts';

//#region Exports
// All exports are above
//#endregion Exports
