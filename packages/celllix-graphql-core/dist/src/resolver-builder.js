/**
 * Generic resolver builder utility for GraphQL applications.
 * Automatically loads and merges all resolver files from the application's types directory.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';
// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Creates resolver and permission builders for the application
 * @param applicationRootPath - Path to the application's schema root directory (defaults to current package root)
 */
export function createResolverBuilders(applicationRootPath) {
    const rootPath = applicationRootPath || path.resolve(__dirname, '../../../');
    // Load compiled resolver JS from dist:
    const resolversGlob = path.resolve(rootPath, 'dist/src/schema/types/**/*.resolvers.{js,cjs,mjs}');
    const permissionsGlob = path.resolve(rootPath, 'dist/src/schema/types/**/*.permissions.{js,cjs,mjs}');
    const resolversArray = loadFilesSync(resolversGlob);
    const permissionsArray = loadFilesSync(permissionsGlob);
    return {
        resolvers: mergeResolvers(resolversArray),
        permissions: mergeResolvers(permissionsArray),
    };
}
//# sourceMappingURL=resolver-builder.js.map