/**
 * This file is used to traverse  all the files in this directory
 * and merge them together to create the application schema
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';
import type { Resolvers } from './generated.ts';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load compiled resolver JS from dist:
// dist/src/schema/builder -> up to dist/src -> dist -> package root -> dist/src/schema/types
const resolversGlob = path.resolve(__dirname, '../types/**/*.resolvers.{js,cjs,mjs}');
const permissionsGlob = path.resolve(__dirname, '../types/**/*.permissions.{js,cjs,mjs}');

const resolversArray = loadFilesSync(resolversGlob);
const permissionsArray = loadFilesSync(permissionsGlob);

export const resolvers: Resolvers = mergeResolvers(resolversArray);
export const permissions: Resolvers = mergeResolvers(permissionsArray);