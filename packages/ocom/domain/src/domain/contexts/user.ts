// #region Exports - User Context Aggregate
// This file consolidates all exports from the User bounded context.
// No barrel files (index.ts) are used in this context.

// EndUser aggregate
export type { EndUserRepository } from './user/end-user/end-user.repository.ts';
export type { EndUserEntityReference, EndUserProps } from './user/end-user/end-user.ts';
export { EndUser } from './user/end-user/end-user.ts';
export type { EndUserUnitOfWork } from './user/end-user/end-user.uow.ts';
export type { EndUserContactInformationProps } from './user/end-user/end-user-contact-information.ts';
export type { EndUserIdentityDetailsProps } from './user/end-user/end-user-identity-details.ts';
export type { EndUserPersonalInformationProps } from './user/end-user/end-user-personal-information.ts';

// StaffRole aggregate
export type { StaffRoleRepository } from './user/staff-role/staff-role.repository.ts';
export type {
	StaffRoleEntityReference,
	StaffRoleProps,
} from './user/staff-role/staff-role.ts';
export { StaffRole } from './user/staff-role/staff-role.ts';
export type { StaffRoleUnitOfWork } from './user/staff-role/staff-role.uow.ts';
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

// StaffUser aggregate
export type { StaffUserRepository } from './user/staff-user/staff-user.repository.ts';
export {
	StaffUser,
	type StaffUserEntityReference,
	type StaffUserProps,
} from './user/staff-user/staff-user.ts';
export type { StaffUserUnitOfWork } from './user/staff-user/staff-user.uow.ts';

// VendorUser aggregate
export type { VendorUserRepository } from './user/vendor-user/vendor-user.repository.ts';
export {
	VendorUser,
	type VendorUserEntityReference,
	type VendorUserProps,
} from './user/vendor-user/vendor-user.ts';
export type { VendorUserUnitOfWork } from './user/vendor-user/vendor-user.uow.ts';
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

// User context-level exports
export type { UserPassport } from './user/user.passport.ts';
export type { UserVisa } from './user/user.visa.ts';
export type { UserDomainPermissions } from './user/user.domain-permissions.ts';

// #endregion
