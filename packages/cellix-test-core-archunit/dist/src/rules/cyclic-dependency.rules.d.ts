/**
 * Cyclic Dependency Rules for CellixJS
 *
 * These rules detect and prevent circular dependencies which can lead to:
 * - Tight coupling
 * - Difficult testing
 * - Complex dependency graphs
 * - Build and runtime issues
 */
/**
 * No cycles within domain layer
 * Domain should have clean dependency graphs
 */
export declare const domainShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * No cycles within application layer
 */
export declare const applicationShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * No cycles within infrastructure/services
 */
export declare const servicesShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * No cycles within API layer
 */
export declare const apiShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
export declare const apiGraphqlShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
export declare const apiRestShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * No cycles within UI components
 */
export declare const uiShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
export declare const uiComponentsShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * No cycles within seedwork/shared libraries
 */
export declare const seedworkShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * Package-level cycle detection
 * Check for cycles at the package boundary level
 */
export declare const packagesShouldHaveNoCycles: () => import("archunit").CycleFreeFileCondition;
/**
 * All cyclic dependency rules combined
 */
export declare const allCyclicDependencyRules: (() => import("archunit").CycleFreeFileCondition)[];
