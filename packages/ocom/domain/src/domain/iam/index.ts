import { GuestPassport as GuestPassportImport } from './guest/guest.passport.ts';
import { MemberPassport as MemberPassportImport } from './member/member.passport.ts';
import { SystemPassport as SystemPassportImport } from './system/system.passport.ts';
import { StaffUserPassport as StaffUserPassportImport } from './user/staff-user/staff-user.passport.ts';

export const GuestPassport = GuestPassportImport;
export const MemberPassport = MemberPassportImport;
export const SystemPassport = SystemPassportImport;
export const StaffUserPassport = StaffUserPassportImport;