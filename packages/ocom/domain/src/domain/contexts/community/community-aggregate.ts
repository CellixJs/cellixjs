// biome-ignore lint/performance/noBarrelFile: This is an intentional aggregate export file as per DDD context pattern
// biome-ignore lint/performance/noReExportAll: This file serves as the public API for the domain context
/**
 * Community Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { CommunityRepository } from './community/community.repository.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	Community,
	type CommunityEntityReference,
	type CommunityProps,
} from './community/community.ts';
export type { CommunityUnitOfWork } from './community/community.uow.ts';

//#region Exports
// All exports are above
//#endregion Exports
