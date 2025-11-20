/**
 * Member Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { MemberRepository } from './member/member.repository.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	Member,
	type MemberEntityReference,
	type MemberProps,
} from './member/member.ts';
export type { MemberUnitOfWork } from './member/member.uow.ts';
export type {
	MemberAccountEntityReference,
	MemberAccountProps,
} from './member/member-account.ts';
export { AccountStatusCodes as MemberAccountStatusCodes } from './member/member-account.value-objects.ts';
export type {
	MemberCustomViewEntityReference,
	MemberCustomViewProps,
} from './member/member-custom-view.ts';
export type {
	MemberProfileEntityReference,
	MemberProfileProps,
} from './member/member-profile.ts';

//#region Exports
// All exports are above
//#endregion Exports
