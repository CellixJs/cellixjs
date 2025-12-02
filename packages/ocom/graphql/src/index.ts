// Export application schema and resolvers
export { combinedSchema } from './schema/builder/schema-builder.ts';
export { resolvers, permissions } from './schema/builder/resolver-builder.ts';

// Export GraphContext for use in handlers and tests
export type { GraphContext } from './schema/context.ts';