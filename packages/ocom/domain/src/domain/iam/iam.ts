/**
 * IAM (Identity and Access Management) Aggregate Export File
 */

//#region Exports
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { GuestPassport } from './guest/guest.passport.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { MemberPassport } from './member/member.passport.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { SystemPassport } from './system/system.passport.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { StaffUserPassport } from './user/staff-user/staff-user.passport.ts';
//#endregion Exports
