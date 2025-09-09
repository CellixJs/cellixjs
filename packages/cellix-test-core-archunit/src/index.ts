/**
 * @cellix/test-core-archunit
 * 
 * ArchUnit testing utilities and rules for Cellix workspace packages
 */

// Export all Clean Architecture rules
export * from './rules/clean-architecture.rules.js';
export * from './rules/cyclic-dependency.rules.js';
export * from './rules/domain-layer.rules.js';
export * from './rules/naming-convention.rules.js';

// Export test helpers and utilities
export * from './utils/test-helpers.js';
export * from './utils/matchers.js';

// Re-export archunit for convenience
export { projectFiles, metrics } from 'archunit';