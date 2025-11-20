/**
 * User Context Aggregate Export File
 */
import type { UserPassport } from './user.passport.ts';
import type { UserVisa } from './user.visa.ts';

//#region Exports
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as EndUser from './end-user.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as StaffRole from './staff-role.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as StaffUser from './staff-user.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as VendorUser from './vendor-user.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { UserPassport, UserVisa };
//#endregion Exports
