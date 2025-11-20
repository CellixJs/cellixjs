/**
 * Property Context Aggregate Export File
 */
import type { PropertyPassport } from './property.passport.ts';
import type { PropertyVisa } from './property.visa.ts';

// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as Property from './property-aggregate.ts';

//#region Exports
export type { PropertyPassport, PropertyVisa };
//#endregion Exports
