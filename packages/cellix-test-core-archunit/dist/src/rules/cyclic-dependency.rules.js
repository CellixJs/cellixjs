/**
 * Cyclic Dependency Rules for CellixJS
 *
 * These rules detect and prevent circular dependencies which can lead to:
 * - Tight coupling
 * - Difficult testing
 * - Complex dependency graphs
 * - Build and runtime issues
 */
import { projectFiles } from 'archunit';
/**
 * No cycles within domain layer
 * Domain should have clean dependency graphs
 */
export const domainShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/domain/**')
    .should()
    .haveNoCycles();
/**
 * No cycles within application layer
 */
export const applicationShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/application/**')
    .should()
    .haveNoCycles();
/**
 * No cycles within infrastructure/services
 */
export const servicesShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/service-*/**')
    .should()
    .haveNoCycles();
/**
 * No cycles within API layer
 */
export const apiShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/api/**')
    .should()
    .haveNoCycles();
export const apiGraphqlShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/api-graphql/**')
    .should()
    .haveNoCycles();
export const apiRestShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/api-rest/**')
    .should()
    .haveNoCycles();
/**
 * No cycles within UI components
 */
export const uiShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/ui-*/**')
    .should()
    .haveNoCycles();
export const uiComponentsShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/ui-components/**')
    .should()
    .haveNoCycles();
/**
 * No cycles within seedwork/shared libraries
 */
export const seedworkShouldHaveNoCycles = () => projectFiles()
    .inFolder('**/cellix-*seedwork*/**')
    .should()
    .haveNoCycles();
/**
 * Package-level cycle detection
 * Check for cycles at the package boundary level
 */
export const packagesShouldHaveNoCycles = () => projectFiles()
    .inFolder('packages/**')
    .should()
    .haveNoCycles();
/**
 * All cyclic dependency rules combined
 */
export const allCyclicDependencyRules = [
    domainShouldHaveNoCycles,
    applicationShouldHaveNoCycles,
    servicesShouldHaveNoCycles,
    apiShouldHaveNoCycles,
    apiGraphqlShouldHaveNoCycles,
    apiRestShouldHaveNoCycles,
    uiShouldHaveNoCycles,
    uiComponentsShouldHaveNoCycles,
    seedworkShouldHaveNoCycles,
    packagesShouldHaveNoCycles,
];
//# sourceMappingURL=cyclic-dependency.rules.js.map