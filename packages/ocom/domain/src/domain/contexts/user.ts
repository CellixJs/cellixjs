/**
 * User Domain Context Aggregate
 * 
 * This file consolidates all exports from the User bounded context,
 * including EndUser, StaffUser, VendorUser, and StaffRole subcontexts.
 * 
 * All entities, repositories, unit of work types, and value objects
 * are exported from this single entry point.
 */

//#region EndUser
export { EndUser } from './user/end-user/end-user.ts';
export type { EndUserEntityReference, EndUserProps } from './user/end-user/end-user.ts';
export type { EndUserContactInformationProps } from './user/end-user/end-user-contact-information.ts';
export type { EndUserIdentityDetailsProps } from './user/end-user/end-user-identity-details.ts';
export type { EndUserPersonalInformationProps } from './user/end-user/end-user-personal-information.ts';
export type { EndUserRepository } from './user/end-user/end-user.repository.ts';
export type { EndUserUnitOfWork } from './user/end-user/end-user.uow.ts';
//#endregion

//#region StaffRole
export { StaffRole } from './user/staff-role/staff-role.ts';
export type {
	StaffRoleProps,
	StaffRoleEntityReference,
} from './user/staff-role/staff-role.ts';
export type {
	StaffRolePermissionsProps,
	StaffRolePermissionsEntityReference,
} from './user/staff-role/staff-role-permissions.ts';
export type {
	StaffRoleCommunityPermissionsProps,
	StaffRoleCommunityPermissionsEntityReference,
} from './user/staff-role/staff-role-community-permissions.ts';
export type {
	StaffRolePropertyPermissionsProps,
	StaffRolePropertyPermissionsEntityReference,
} from './user/staff-role/staff-role-property-permissions.ts';
export type {
	StaffRoleServicePermissionsProps,
	StaffRoleServicePermissionsEntityReference,
} from './user/staff-role/staff-role-service-permissions.ts';
export type {
	StaffRoleServiceTicketPermissionsProps,
	StaffRoleServiceTicketPermissionsEntityReference,
} from './user/staff-role/staff-role-service-ticket-permissions.ts';
export type {
	StaffRoleViolationTicketPermissionsProps,
	StaffRoleViolationTicketPermissionsEntityReference,
} from './user/staff-role/staff-role-violation-ticket-permissions.ts';
export type { StaffRoleRepository } from './user/staff-role/staff-role.repository.ts';
export type { StaffRoleUnitOfWork } from './user/staff-role/staff-role.uow.ts';
//#endregion

//#region StaffUser
export type { StaffUserRepository } from './user/staff-user/staff-user.repository.ts';
export {
	StaffUser,
	type StaffUserEntityReference,
	type StaffUserProps,
} from './user/staff-user/staff-user.ts';
export type { StaffUserUnitOfWork } from './user/staff-user/staff-user.uow.ts';
//#endregion

//#region VendorUser
export type {
    VendorUserContactInformationEntityReference,
    VendorUserContactInformationProps
} from './user/vendor-user/vendor-user-contact-information.ts';
export type {
    VendorUserIdentityDetailsEntityReference,
    VendorUserIdentityDetailsProps
} from './user/vendor-user/vendor-user-identity-details.ts';
export type {
    VendorUserPersonalInformationEntityReference,
    VendorUserPersonalInformationProps
} from './user/vendor-user/vendor-user-personal-information.ts';
export type { VendorUserRepository } from './user/vendor-user/vendor-user.repository.ts';
export {
    VendorUser,
    type VendorUserEntityReference,
    type VendorUserProps
} from './user/vendor-user/vendor-user.ts';
export type { VendorUserUnitOfWork } from './user/vendor-user/vendor-user.uow.ts';
//#endregion
