/**
 * Naming Convention Rules for CellixJS
 *
 * These rules enforce consistent naming patterns across the codebase
 */
/**
 * Package structure should be consistent
 */
export declare const packageStructureShouldBeConsistent: () => import("archunit").CycleFreeFileCondition;
/**
 * UI components should not depend on backend services
 */
export declare const uiShouldNotDependOnServices: () => import("archunit").DependOnFileCondition;
