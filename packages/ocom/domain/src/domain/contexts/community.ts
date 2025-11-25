// #region Exports - Community Context Aggregate
// This file consolidates all exports from the Community bounded context.
// No barrel files (index.ts) are used in this context.

// Community aggregate
export {
	Community,
	type CommunityEntityReference,
	type CommunityProps,
} from './community/community/community.ts';
export type { CommunityRepository } from './community/community/community.repository.ts';
export type { CommunityUnitOfWork } from './community/community/community.uow.ts';

// Member aggregate
export type { MemberRepository } from './community/member/member.repository.ts';
export {
	Member,
	type MemberEntityReference,
	type MemberProps,
} from './community/member/member.ts';
export type { MemberUnitOfWork } from './community/member/member.uow.ts';
export type {
	MemberAccountEntityReference,
	MemberAccountProps,
} from './community/member/member-account.ts';
export { AccountStatusCodes as MemberAccountStatusCodes } from './community/member/member-account.value-objects.ts';
export type {
	MemberCustomViewEntityReference,
	MemberCustomViewProps,
} from './community/member/member-custom-view.ts';
export type {
	MemberProfileEntityReference,
	MemberProfileProps,
} from './community/member/member-profile.ts';

// EndUserRole aggregate
export {
	EndUserRole,
	type EndUserRoleEntityReference,
	type EndUserRoleProps,
} from './community/role/end-user-role/end-user-role.ts';
export type { EndUserRoleRepository } from './community/role/end-user-role/end-user-role.repository.ts';
export type { EndUserRoleUnitOfWork } from './community/role/end-user-role/end-user-role.uow.ts';
export type {
	EndUserRoleCommunityPermissionsEntityReference,
	EndUserRoleCommunityPermissionsProps,
} from './community/role/end-user-role/end-user-role-community-permissions.ts';
export type { EndUserRolePermissionsProps } from './community/role/end-user-role/end-user-role-permissions.ts';
export type {
	EndUserRolePropertyPermissionsEntityReference,
	EndUserRolePropertyPermissionsProps,
} from './community/role/end-user-role/end-user-role-property-permissions.ts';
export type {
	EndUserRoleServicePermissionsEntityReference,
	EndUserRoleServicePermissionsProps,
} from './community/role/end-user-role/end-user-role-service-permissions.ts';
export type {
	EndUserRoleServiceTicketPermissionsEntityReference,
	EndUserRoleServiceTicketPermissionsProps,
} from './community/role/end-user-role/end-user-role-service-ticket-permissions.ts';
export type {
	EndUserRoleViolationTicketPermissionsEntityReference,
	EndUserRoleViolationTicketPermissionsProps,
} from './community/role/end-user-role/end-user-role-violation-ticket-permissions.ts';

// VendorUserRole aggregate
export {
	VendorUserRole,
	type VendorUserRoleEntityReference,
	type VendorUserRoleProps,
} from './community/role/vendor-user-role/vendor-user-role.ts';
export type { VendorUserRoleRepository } from './community/role/vendor-user-role/vendor-user-role.repository.ts';
export type { VendorUserRoleUnitOfWork } from './community/role/vendor-user-role/vendor-user-role.uow.ts';
export type {
	VendorUserRoleCommunityPermissionsEntityReference,
	VendorUserRoleCommunityPermissionsProps,
} from './community/role/vendor-user-role/vendor-user-role-community-permissions.ts';
export type { VendorUserRolePermissionsProps } from './community/role/vendor-user-role/vendor-user-role-permissions.ts';
export type {
	VendorUserRolePropertyPermissionsEntityReference,
	VendorUserRolePropertyPermissionsProps,
} from './community/role/vendor-user-role/vendor-user-role-property-permissions.ts';
export type {
	VendorUserRoleServicePermissionsEntityReference,
	VendorUserRoleServicePermissionsProps,
} from './community/role/vendor-user-role/vendor-user-role-service-permissions.ts';
export type {
	VendorUserRoleServiceTicketPermissionsEntityReference,
	VendorUserRoleServiceTicketPermissionsProps,
} from './community/role/vendor-user-role/vendor-user-role-service-ticket-permissions.ts';
export type {
	VendorUserRoleViolationTicketPermissionsEntityReference,
	VendorUserRoleViolationTicketPermissionsProps,
} from './community/role/vendor-user-role/vendor-user-role-violation-ticket-permissions.ts';

// Community context-level exports
export type { CommunityPassport } from './community/community.passport.ts';
export type { CommunityVisa } from './community/community.visa.ts';
export type { CommunityDomainPermissions } from './community/community.domain-permissions.ts';

// #endregion
