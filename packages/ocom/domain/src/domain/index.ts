/**
 * Domain Layer Public API
 */

//#region Exports
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for domain layer
export * as Contexts from './contexts/contexts.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export { type Passport, PassportFactory } from './contexts/passport.ts';
export type { DomainExecutionContext } from './domain-execution-context.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for domain events
export * as Events from './events/events.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for domain services
export * as Services from './services/services.ts';
//#endregion Exports
