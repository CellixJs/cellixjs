/**
 * This file is used to traverse  all the files in this directory
 * and merge them together to create the application schema
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadResolversFromGlob } from '@cellix/graphql-core';
import type { Resolvers } from './generated.ts';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load compiled resolver JS from dist:
// dist/src/schema/builder -> up to dist/src -> dist -> package root -> dist/src/schema/types
const resolversGlob = path.resolve(__dirname, '../types/**/*.resolvers.{js,cjs,mjs}');
const permissionsGlob = path.resolve(__dirname, '../types/**/*.permissions.{js,cjs,mjs}');

export const resolvers: Resolvers = loadResolversFromGlob(resolversGlob);
export const permissions: Resolvers = loadResolversFromGlob(permissionsGlob);