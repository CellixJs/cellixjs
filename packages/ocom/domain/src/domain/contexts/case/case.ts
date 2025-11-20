/**
 * Case Context Aggregate Export File
 */
import type { CasePassport } from './case.passport.ts';
import type { CaseVisa } from './case.visa.ts';

//#region Exports
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as ServiceTicket from './service-ticket.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as ViolationTicket from './violation-ticket.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { CasePassport, CaseVisa };
//#endregion Exports
