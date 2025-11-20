/**
 * Property Context Aggregate Export File
 */
import type { PropertyPassport } from './property.passport.ts';
import type { PropertyVisa } from './property.visa.ts';

//#region Exports
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as Property from './property-aggregate.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { PropertyPassport, PropertyVisa };
//#endregion Exports
