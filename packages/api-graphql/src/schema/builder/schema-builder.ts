/**
 * Application-specific schema builder using @celllix/graphql-core
 */
import { createCellixSchemaSimple } from '@celllix/graphql-core';
import type { GraphContext } from '../context.ts';
import { resolvers } from './resolver-builder.ts';

// Create the combined schema using Cellix GraphQL core utilities
export const combinedSchema = createCellixSchemaSimple<GraphContext>(resolvers);