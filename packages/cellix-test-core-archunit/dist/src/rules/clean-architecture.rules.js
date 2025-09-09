/**
 * Clean Architecture Rules for CellixJS
 *
 * These rules enforce the fundamental principles of Clean Architecture:
 * - The Dependency Rule: Dependencies should point inward
 * - Domain independence: Inner layers should not depend on outer layers
 * - Interface segregation: Interfaces should be focused and lean
 */
import { projectFiles } from 'archunit';
/**
 * Domain layer should not depend on any external layers
 * Domain represents the innermost layer and should be completely independent
 */
export const domainShouldNotDependOnInfrastructure = () => projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/infrastructure/**');
export const domainShouldNotDependOnApplication = () => projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/application/**');
export const domainShouldNotDependOnApi = () => projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/api/**');
export const domainShouldNotDependOnUI = () => projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/ui/**');
/**
 * Application layer should not depend on infrastructure or UI layers
 * Application layer orchestrates domain objects but should not depend on external concerns
 */
export const applicationShouldNotDependOnInfrastructure = () => projectFiles()
    .inFolder('**/application/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/infrastructure/**');
export const applicationShouldNotDependOnUI = () => projectFiles()
    .inFolder('**/application/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/ui/**');
export const applicationShouldNotDependOnApi = () => projectFiles()
    .inFolder('**/application/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/api/**');
/**
 * UI/Presentation layer rules
 * UI can depend on application and domain but not infrastructure
 */
export const uiShouldNotDependOnInfrastructure = () => projectFiles()
    .inFolder('**/ui/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/infrastructure/**');
/**
 * Service layer rules (for services that are infrastructure concerns)
 */
export const servicesShouldNotDependOnDomain = () => projectFiles()
    .inFolder('**/service-*/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/domain/**');
export const servicesShouldNotDependOnApplication = () => projectFiles()
    .inFolder('**/service-*/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/application/**');
//# sourceMappingURL=clean-architecture.rules.js.map