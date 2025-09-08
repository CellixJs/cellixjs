/**
 * Naming Convention Rules for CellixJS
 * 
 * These rules enforce consistent naming conventions across the codebase:
 * - File naming patterns
 * - Directory structure conventions
 * - TypeScript interface and class naming
 * - Component naming patterns
 */

import { projectFiles } from 'archunit';

/**
 * Test files should follow naming conventions
 */
export const testFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.test.ts')
    .should()
    .exist();

export const specFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.spec.ts')
    .should()
    .exist();

/**
 * Architecture tests should follow naming conventions
 */
export const architectureTestsShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.arch.test.ts')
    .should()
    .matchPattern('*.arch.test.ts');

/**
 * Configuration files should use kebab-case
 */
export const configFilesShouldUseKebabCase = () =>
  projectFiles()
    .withName('*.config.ts')
    .should()
    .matchPattern('*.config.ts');

export const vitestConfigsShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('vitest.*.config.ts')
    .should()
    .matchPattern('vitest.*.config.ts');

/**
 * TypeScript declaration files
 */
export const declarationFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.d.ts')
    .should()
    .matchPattern('*.d.ts');

/**
 * Index files should be consistently named
 */
export const indexFilesShouldBeConsistent = () =>
  projectFiles()
    .withName('index.ts')
    .should()
    .matchPattern('index.ts');

/**
 * Package.json files should be lowercase
 */
export const packageJsonShouldBeLowercase = () =>
  projectFiles()
    .withName('package.json')
    .should()
    .matchPattern('package.json');

/**
 * README files should be consistent
 */
export const readmeFilesShouldBeConsistent = () =>
  projectFiles()
    .withName(/^README\.md$/i)
    .should()
    .matchPattern(/^README\.md$/i);

/**
 * Instructions files should follow conventions
 */
export const instructionFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.instructions.md')
    .should()
    .matchPattern('*.instructions.md');

/**
 * Feature files (BDD/Cucumber) should follow conventions
 */
export const featureFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.feature')
    .should()
    .matchPattern('*.feature');

/**
 * UI Component naming conventions
 */
export const reactComponentsShouldUsePascalCase = () =>
  projectFiles()
    .inFolder('**/ui-*/src/components/**')
    .withName(/^[A-Z][a-zA-Z]*\.tsx?$/)
    .should()
    .matchPattern(/^[A-Z][a-zA-Z]*\.tsx?$/);

export const storybookStoriesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.stories.tsx')
    .should()
    .matchPattern('*.stories.tsx');

/**
 * Service files should be kebab-case
 */
export const serviceFilesShouldUseKebabCase = () =>
  projectFiles()
    .inFolder('**/service-*/**')
    .withName(/^[a-z][a-z-]*\.ts$/)
    .should()
    .matchPattern(/^[a-z][a-z-]*\.ts$/);

/**
 * API files should follow RESTful conventions
 */
export const apiFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/api/**')
    .withName(/^[a-z][a-z-]*\.(ts|js)$/)
    .should()
    .matchPattern(/^[a-z][a-z-]*\.(ts|js)$/);

/**
 * GraphQL files should follow conventions
 */
export const graphqlFilesShouldFollowNamingConvention = () =>
  projectFiles()
    .withName('*.graphql')
    .should()
    .matchPattern('*.graphql');

export const graphqlResolversShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/api-graphql/**')
    .withName('*.resolver.ts')
    .should()
    .matchPattern('*.resolver.ts');

/**
 * All naming convention rules combined
 */
export const allNamingConventionRules = [
  testFilesShouldFollowNamingConvention,
  specFilesShouldFollowNamingConvention,
  architectureTestsShouldFollowNamingConvention,
  configFilesShouldUseKebabCase,
  vitestConfigsShouldFollowNamingConvention,
  declarationFilesShouldFollowNamingConvention,
  indexFilesShouldBeConsistent,
  packageJsonShouldBeLowercase,
  readmeFilesShouldBeConsistent,
  instructionFilesShouldFollowNamingConvention,
  featureFilesShouldFollowNamingConvention,
  reactComponentsShouldUsePascalCase,
  storybookStoriesShouldFollowNamingConvention,
  serviceFilesShouldUseKebabCase,
  apiFilesShouldFollowNamingConvention,
  graphqlFilesShouldFollowNamingConvention,
  graphqlResolversShouldFollowNamingConvention,
];