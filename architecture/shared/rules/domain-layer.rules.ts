/**
 * Domain Layer Architectural Rules for CellixJS
 * 
 * These rules enforce Domain-Driven Design (DDD) principles:
 * - Aggregate boundaries
 * - Value object immutability  
 * - Domain service location
 * - Entity and aggregate root responsibilities
 */

import { projectFiles, metrics } from 'archunit';

/**
 * Domain contexts should be properly organized
 */
export const domainContextsShouldBeWellOrganized = () =>
  projectFiles()
    .inFolder('**/domain/contexts/**')
    .should()
    .haveNoCycles();

/**
 * Entities should follow naming conventions
 */
export const entitiesShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/domain/contexts/**')
    .withName('*.entity.ts')
    .should()
    .exist();

/**
 * Value objects should follow naming conventions
 */
export const valueObjectsShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/domain/contexts/**')
    .withName('*.value-objects.ts')
    .should()
    .exist();

/**
 * Unit of Work interfaces should follow naming conventions
 */
export const unitOfWorksShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/domain/contexts/**')
    .withName('*.uow.ts')
    .should()
    .exist();

/**
 * Domain services should be focused and cohesive
 */
export const domainServicesShouldHaveHighCohesion = () =>
  metrics()
    .inFolder('**/domain/services/**')
    .lcom()
    .lcom96b()
    .shouldBeBelow(0.5);

/**
 * Domain events should be lightweight
 */
export const domainEventsShouldBeLightweight = () =>
  metrics()
    .inFolder('**/domain/events/**')
    .count()
    .linesOfCode()
    .shouldBeBelow(50);

/**
 * Domain entities should not be too large
 */
export const domainEntitiesShouldBeReasonablySize = () =>
  metrics()
    .withName('*.entity.ts')
    .count()
    .linesOfCode()
    .shouldBeBelow(300);

/**
 * Aggregates should not be too complex
 */
export const aggregatesShouldNotBeTooComplex = () =>
  metrics()
    .withName('*.entity.ts')
    .count()
    .methodCount()
    .shouldBeBelow(15);

/**
 * Domain should not depend on external frameworks
 * (except for basic utility libraries)
 */
export const domainShouldNotDependOnFrameworks = () =>
  projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inPath('**/node_modules/express/**');

export const domainShouldNotDependOnAzureFunctions = () =>
  projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inPath('**/node_modules/@azure/functions/**');

export const domainShouldNotDependOnMongoose = () =>
  projectFiles()
    .inFolder('**/domain/**')
    .shouldNot()
    .dependOnFiles()
    .inPath('**/node_modules/mongoose/**');

/**
 * IAM (Identity Access Management) domain rules
 */
export const iamPassportsShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/domain/iam/**')
    .withName('*.passport.ts')
    .should()
    .exist();

export const iamVisasShouldFollowNamingConvention = () =>
  projectFiles()
    .inFolder('**/domain/iam/**')
    .withName('*.visa.ts')
    .should()
    .exist();

/**
 * All domain layer rules combined
 */
export const allDomainLayerRules = [
  domainContextsShouldBeWellOrganized,
  entitiesShouldFollowNamingConvention,
  valueObjectsShouldFollowNamingConvention,
  unitOfWorksShouldFollowNamingConvention,
  domainServicesShouldHaveHighCohesion,
  domainEventsShouldBeLightweight,
  domainEntitiesShouldBeReasonablySize,
  aggregatesShouldNotBeTooComplex,
  domainShouldNotDependOnFrameworks,
  domainShouldNotDependOnAzureFunctions,
  domainShouldNotDependOnMongoose,
  iamPassportsShouldFollowNamingConvention,
  iamVisasShouldFollowNamingConvention,
];