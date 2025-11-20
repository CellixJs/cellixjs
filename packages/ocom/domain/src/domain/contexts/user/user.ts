/**
 * User Context Aggregate Export File
 */
import type { UserPassport } from './user.passport.ts';
import type { UserVisa } from './user.visa.ts';

// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as EndUser from './end-user.ts';
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as StaffRole from './staff-role.ts';
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as StaffUser from './staff-user.ts';
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as VendorUser from './vendor-user.ts';

//#region Exports
export type { UserPassport, UserVisa };
//#endregion Exports
