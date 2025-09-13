import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as Scalars from 'graphql-scalars';
import type { GraphContext } from '../../init/context.ts';
import { resolvers } from './resolver-builder.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SDL directly from the source tree.
// dist/src/schema/builder -> repo root -> src/schema/**/*.graphql
const typeDefsGlob = path.resolve(__dirname, '../../../../', 'src/schema/**/*.graphql');
const sdlFiles = loadFilesSync(typeDefsGlob);

// IMPORTANT: include scalar typeDefs so SDL references like DateTime/ObjectID are defined
const typeDefs = mergeTypeDefs([
  ...Scalars.typeDefs, // provides: scalar DateTime, scalar ObjectID, etc.
  ...sdlFiles,
]);

// Include scalar resolvers alongside your resolvers
export const combinedSchema = makeExecutableSchema<GraphContext>({
  typeDefs,
  resolvers: [Scalars.resolvers, resolvers],
});