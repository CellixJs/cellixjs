/**
 * Staff Role Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { StaffRoleRepository } from './staff-role/staff-role.repository.ts';
export type {
	StaffRoleEntityReference,
	StaffRoleProps,
} from './staff-role/staff-role.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { StaffRole } from './staff-role/staff-role.ts';
export type { StaffRoleUnitOfWork } from './staff-role/staff-role.uow.ts';
export type {
	StaffRoleCommunityPermissionsEntityReference,
	StaffRoleCommunityPermissionsProps,
} from './staff-role/staff-role-community-permissions.ts';
export type {
	StaffRolePermissionsEntityReference,
	StaffRolePermissionsProps,
} from './staff-role/staff-role-permissions.ts';
export type {
	StaffRolePropertyPermissionsEntityReference,
	StaffRolePropertyPermissionsProps,
} from './staff-role/staff-role-property-permissions.ts';
export type {
	StaffRoleServicePermissionsEntityReference,
	StaffRoleServicePermissionsProps,
} from './staff-role/staff-role-service-permissions.ts';
export type {
	StaffRoleServiceTicketPermissionsEntityReference,
	StaffRoleServiceTicketPermissionsProps,
} from './staff-role/staff-role-service-ticket-permissions.ts';
export type {
	StaffRoleViolationTicketPermissionsEntityReference,
	StaffRoleViolationTicketPermissionsProps,
} from './staff-role/staff-role-violation-ticket-permissions.ts';

//#region Exports
// All exports are above
//#endregion Exports
