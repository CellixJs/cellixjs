/**
 * Domain Layer Rules for CellixJS
 *
 * These rules ensure the domain layer follows Clean Architecture
 * and Domain-Driven Design principles
 */
/**
 * Domain should not depend on external APIs
 */
export declare const domainShouldNotDependOnExternalAPIs: () => import("archunit").DependOnFileCondition;
/**
 * Domain contexts should be well organized
 */
export declare const domainContextsShouldBeWellOrganized: () => import("archunit").CycleFreeFileCondition;
