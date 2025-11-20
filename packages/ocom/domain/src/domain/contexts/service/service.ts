/**
 * Service Context Aggregate Export File
 * 
 * This file serves as the intentional public API for the Service bounded context,
 * aggregating exports from multiple files as per DDD patterns.
 */

import type { ServicePassport } from './service.passport.ts';
import type { ServiceVisa } from './service.visa.ts';

// Re-export Service subdirectory as namespace to maintain structure
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as Service from './service-aggregate.ts';

//#region Exports
export type { ServicePassport, ServiceVisa };
//#endregion Exports
