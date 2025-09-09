/**
 * Naming Convention Rules for CellixJS
 *
 * These rules enforce consistent naming patterns across the codebase
 */
import { projectFiles } from 'archunit';
/**
 * Package structure should be consistent
 */
export const packageStructureShouldBeConsistent = () => projectFiles()
    .inFolder('packages/**')
    .should()
    .haveNoCycles();
/**
 * UI components should not depend on backend services
 */
export const uiShouldNotDependOnServices = () => projectFiles()
    .inFolder('**/ui-*/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/service-*/**');
//# sourceMappingURL=naming-convention.rules.js.map