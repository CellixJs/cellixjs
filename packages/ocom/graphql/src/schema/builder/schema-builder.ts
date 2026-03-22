import { buildCellixSchema } from '@cellix/graphql-core';
import type { GraphContext } from '../context.ts';
import { resolvers } from './resolver-builder.ts';
import type { GraphQLSchema } from 'graphql';
import { ocomGraphqlTypeDefs } from './schema-type-defs.generated.ts';

// Build the complete schema using Cellix core utilities
export const combinedSchema: GraphQLSchema = buildCellixSchema<GraphContext>(
  [...ocomGraphqlTypeDefs], // Additional type definitions
  [resolvers], // Additional resolvers
);
