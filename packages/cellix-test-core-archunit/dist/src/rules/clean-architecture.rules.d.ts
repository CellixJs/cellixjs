/**
 * Clean Architecture Rules for CellixJS
 *
 * These rules enforce the fundamental principles of Clean Architecture:
 * - The Dependency Rule: Dependencies should point inward
 * - Domain independence: Inner layers should not depend on outer layers
 * - Interface segregation: Interfaces should be focused and lean
 */
/**
 * Domain layer should not depend on any external layers
 * Domain represents the innermost layer and should be completely independent
 */
export declare const domainShouldNotDependOnInfrastructure: () => import("archunit").DependOnFileCondition;
export declare const domainShouldNotDependOnApplication: () => import("archunit").DependOnFileCondition;
export declare const domainShouldNotDependOnApi: () => import("archunit").DependOnFileCondition;
export declare const domainShouldNotDependOnUI: () => import("archunit").DependOnFileCondition;
/**
 * Application layer should not depend on infrastructure or UI layers
 * Application layer orchestrates domain objects but should not depend on external concerns
 */
export declare const applicationShouldNotDependOnInfrastructure: () => import("archunit").DependOnFileCondition;
export declare const applicationShouldNotDependOnUI: () => import("archunit").DependOnFileCondition;
export declare const applicationShouldNotDependOnApi: () => import("archunit").DependOnFileCondition;
/**
 * UI/Presentation layer rules
 * UI can depend on application and domain but not infrastructure
 */
export declare const uiShouldNotDependOnInfrastructure: () => import("archunit").DependOnFileCondition;
/**
 * Service layer rules (for services that are infrastructure concerns)
 */
export declare const servicesShouldNotDependOnDomain: () => import("archunit").DependOnFileCondition;
export declare const servicesShouldNotDependOnApplication: () => import("archunit").DependOnFileCondition;
