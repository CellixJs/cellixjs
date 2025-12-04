import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { buildCellixSchema } from '@cellix/graphql-core';
import type { GraphContext } from '../context.ts';
import { resolvers } from './resolver-builder.ts';
import type { GraphQLSchema } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load additional SDL files from this package
const typeDefsGlob = path.resolve(__dirname, '../../../../', 'src/schema/**/*.graphql');
const sdlFiles = loadFilesSync(typeDefsGlob);

// Build the complete schema using Cellix core utilities
export const combinedSchema: GraphQLSchema = buildCellixSchema<GraphContext>(
  sdlFiles, // Additional type definitions
  [resolvers], // Additional resolvers
);