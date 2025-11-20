/**
 * Domain Contexts Aggregate Export File
 * 
 * This file serves as the public API for all domain contexts.
 */

//#region Exports
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD contexts
export * as Case from './case/case.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD contexts
export * as Community from './community/community.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD contexts
export * as Property from './property/property.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD contexts
export * as Service from './service/service.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD contexts
export * as User from './user/user.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { type Passport, PassportFactory } from './passport.ts';
//#endregion Exports
