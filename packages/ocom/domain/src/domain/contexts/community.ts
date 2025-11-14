/**
 * Community Domain Context Aggregate
 * 
 * This file consolidates all exports from the Community bounded context,
 * including Community, Member, and Role (EndUserRole, VendorUserRole) subcontexts.
 * 
 * All entities, repositories, unit of work types, and value objects
 * are exported from this single entry point.
 */

//#region Passport and Domain Permissions
export type { CommunityPassport } from './community/community.passport.ts';
//#endregion

//#region Community
export { Community, type CommunityProps, type CommunityEntityReference } from './community/community/community.ts';
export type { CommunityRepository } from './community/community/community.repository.ts';
export type { CommunityUnitOfWork } from './community/community/community.uow.ts';
export * as CommunityValueObjects from './community/community/community.value-objects.ts';
//#endregion

//#region Member
export { Member, type MemberEntityReference, type MemberProps } from './community/member/member.ts';
export type { MemberAccountEntityReference, MemberAccountProps } from './community/member/member-account.ts';
export { AccountStatusCodes as MemberAccountStatusCodes } from './community/member/member-account.value-objects.ts';
export type { MemberCustomViewEntityReference, MemberCustomViewProps } from './community/member/member-custom-view.ts';
export type { MemberProfileEntityReference, MemberProfileProps } from './community/member/member-profile.ts';
export type { MemberRepository } from './community/member/member.repository.ts';
export type { MemberUnitOfWork } from './community/member/member.uow.ts';
//#endregion

//#region EndUserRole
export { EndUserRole, type EndUserRoleEntityReference, type EndUserRoleProps } from './community/role/end-user-role/end-user-role.ts';
export { EndUserRoleCommunityPermissions, type EndUserRoleCommunityPermissionsEntityReference, type EndUserRoleCommunityPermissionsProps } from './community/role/end-user-role/end-user-role-community-permissions.ts';
export { EndUserRolePermissions, type EndUserRolePermissionsEntityReference, type EndUserRolePermissionsProps } from './community/role/end-user-role/end-user-role-permissions.ts';
export { EndUserRolePropertyPermissions, type EndUserRolePropertyPermissionsEntityReference, type EndUserRolePropertyPermissionsProps } from './community/role/end-user-role/end-user-role-property-permissions.ts';
export { EndUserRoleServicePermissions, type EndUserRoleServicePermissionsEntityReference, type EndUserRoleServicePermissionsProps } from './community/role/end-user-role/end-user-role-service-permissions.ts';
export { EndUserRoleServiceTicketPermissions, type EndUserRoleServiceTicketPermissionsEntityReference, type EndUserRoleServiceTicketPermissionsProps } from './community/role/end-user-role/end-user-role-service-ticket-permissions.ts';
export { EndUserRoleViolationTicketPermissions, type EndUserRoleViolationTicketPermissionsEntityReference, type EndUserRoleViolationTicketPermissionsProps } from './community/role/end-user-role/end-user-role-violation-ticket-permissions.ts';
export type { EndUserRoleRepository } from './community/role/end-user-role/end-user-role.repository.ts';
export type { EndUserRoleUnitOfWork } from './community/role/end-user-role/end-user-role.uow.ts';
//#endregion

//#region VendorUserRole
export { VendorUserRole, type VendorUserRoleEntityReference, type VendorUserRoleProps } from './community/role/vendor-user-role/vendor-user-role.ts';
export { VendorUserRoleCommunityPermissions, type VendorUserRoleCommunityPermissionsEntityReference, type VendorUserRoleCommunityPermissionsProps } from './community/role/vendor-user-role/vendor-user-role-community-permissions.ts';
export { VendorUserRolePermissions, type VendorUserRolePermissionsEntityReference, type VendorUserRolePermissionsProps } from './community/role/vendor-user-role/vendor-user-role-permissions.ts';
export { VendorUserRolePropertyPermissions, type VendorUserRolePropertyPermissionsEntityReference, type VendorUserRolePropertyPermissionsProps } from './community/role/vendor-user-role/vendor-user-role-property-permissions.ts';
export { VendorUserRoleServicePermissions, type VendorUserRoleServicePermissionsEntityReference, type VendorUserRoleServicePermissionsProps } from './community/role/vendor-user-role/vendor-user-role-service-permissions.ts';
export { VendorUserRoleServiceTicketPermissions, type VendorUserRoleServiceTicketPermissionsEntityReference, type VendorUserRoleServiceTicketPermissionsProps } from './community/role/vendor-user-role/vendor-user-role-service-ticket-permissions.ts';
export { VendorUserRoleViolationTicketPermissions, type VendorUserRoleViolationTicketPermissionsEntityReference, type VendorUserRoleViolationTicketPermissionsProps } from './community/role/vendor-user-role/vendor-user-role-violation-ticket-permissions.ts';
export type { VendorUserRoleRepository } from './community/role/vendor-user-role/vendor-user-role.repository.ts';
export type { VendorUserRoleUnitOfWork } from './community/role/vendor-user-role/vendor-user-role.uow.ts';
//#endregion
