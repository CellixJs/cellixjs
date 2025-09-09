/**
 * Domain Layer Rules for CellixJS
 *
 * These rules ensure the domain layer follows Clean Architecture
 * and Domain-Driven Design principles
 */
import { projectFiles } from 'archunit';
/**
 * Domain should not depend on external APIs
 */
export const domainShouldNotDependOnExternalAPIs = () => projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('**/api/**');
/**
 * Domain contexts should be well organized
 */
export const domainContextsShouldBeWellOrganized = () => projectFiles()
    .inFolder('**/domain/contexts/**')
    .should()
    .haveNoCycles();
//# sourceMappingURL=domain-layer.rules.js.map