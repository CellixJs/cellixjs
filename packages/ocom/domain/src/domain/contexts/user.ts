/**
 * User Context - Aggregate Exports
 * 
 * This file serves as the single entry point for all User context exports.
 * It consolidates exports from entities, value objects, repositories, and unit of work types.
 */

//#region Exports

// EndUser Aggregate
export {
	EndUser,
	type EndUserEntityReference,
	type EndUserProps,
} from './user/end-user/end-user.ts';

// EndUser Repository & Unit of Work
export type { EndUserRepository } from './user/end-user/end-user.repository.ts';
export type { EndUserUnitOfWork } from './user/end-user/end-user.uow.ts';

// EndUser Entities
export type { EndUserContactInformationProps } from './user/end-user/end-user-contact-information.ts';
export type { EndUserIdentityDetailsProps } from './user/end-user/end-user-identity-details.ts';
export type { EndUserPersonalInformationProps } from './user/end-user/end-user-personal-information.ts';

// StaffRole Aggregate
export {
	StaffRole,
	type StaffRoleEntityReference,
	type StaffRoleProps,
} from './user/staff-role/staff-role.ts';

// StaffRole Repository & Unit of Work
export type { StaffRoleRepository } from './user/staff-role/staff-role.repository.ts';
export type { StaffRoleUnitOfWork } from './user/staff-role/staff-role.uow.ts';

// StaffRole Permissions
export type {
	StaffRoleCommunityPermissionsEntityReference,
	StaffRoleCommunityPermissionsProps,
} from './user/staff-role/staff-role-community-permissions.ts';
export type {
	StaffRolePermissionsEntityReference,
	StaffRolePermissionsProps,
} from './user/staff-role/staff-role-permissions.ts';
export type {
	StaffRolePropertyPermissionsEntityReference,
	StaffRolePropertyPermissionsProps,
} from './user/staff-role/staff-role-property-permissions.ts';
export type {
	StaffRoleServicePermissionsEntityReference,
	StaffRoleServicePermissionsProps,
} from './user/staff-role/staff-role-service-permissions.ts';
export type {
	StaffRoleServiceTicketPermissionsEntityReference,
	StaffRoleServiceTicketPermissionsProps,
} from './user/staff-role/staff-role-service-ticket-permissions.ts';
export type {
	StaffRoleViolationTicketPermissionsEntityReference,
	StaffRoleViolationTicketPermissionsProps,
} from './user/staff-role/staff-role-violation-ticket-permissions.ts';

// StaffUser Aggregate
export {
	StaffUser,
	type StaffUserEntityReference,
	type StaffUserProps,
} from './user/staff-user/staff-user.ts';

// StaffUser Repository & Unit of Work
export type { StaffUserRepository } from './user/staff-user/staff-user.repository.ts';
export type { StaffUserUnitOfWork } from './user/staff-user/staff-user.uow.ts';

// VendorUser Aggregate
export {
	VendorUser,
	type VendorUserEntityReference,
	type VendorUserProps,
} from './user/vendor-user/vendor-user.ts';

// VendorUser Repository & Unit of Work
export type { VendorUserRepository } from './user/vendor-user/vendor-user.repository.ts';
export type { VendorUserUnitOfWork } from './user/vendor-user/vendor-user.uow.ts';

// VendorUser Entities
export type {
	VendorUserContactInformationEntityReference,
	VendorUserContactInformationProps,
} from './user/vendor-user/vendor-user-contact-information.ts';
export type {
	VendorUserIdentityDetailsEntityReference,
	VendorUserIdentityDetailsProps,
} from './user/vendor-user/vendor-user-identity-details.ts';
export type {
	VendorUserPersonalInformationEntityReference,
	VendorUserPersonalInformationProps,
} from './user/vendor-user/vendor-user-personal-information.ts';

// Passport & Visa
export type { UserPassport } from './user/user.passport.ts';
export type { UserVisa } from './user/user.visa.ts';

// Domain Permissions
export type { UserDomainPermissions } from './user/user.domain-permissions.ts';

//#endregion
