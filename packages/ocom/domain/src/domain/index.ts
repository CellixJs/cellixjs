/**
 * Domain Layer Public API
 */

// biome-ignore lint/performance/noReExportAll: Intentional namespace export for domain layer
export * as Contexts from './contexts/contexts.ts';
export { type Passport, PassportFactory } from './contexts/passport.ts';
export type { DomainExecutionContext } from './domain-execution-context.ts';
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for domain events
export * as Events from './events/index.ts';
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for domain services
export * as Services from './services/index.ts';
