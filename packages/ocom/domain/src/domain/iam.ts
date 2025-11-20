/**
 * IAM (Identity and Access Management) - Aggregate Exports
 * 
 * This file serves as the single entry point for all IAM passport implementations.
 */

//#region Exports

// Passport Implementations
export { GuestPassport } from './iam/guest/guest.passport.ts';
export { MemberPassport } from './iam/member/member.passport.ts';
export { SystemPassport } from './iam/system/system.passport.ts';
export { StaffUserPassport } from './iam/user/staff-user/staff-user.passport.ts';

//#endregion
