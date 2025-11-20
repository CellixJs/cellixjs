/**
 * Service Context - Aggregate Exports
 * 
 * This file serves as the single entry point for all Service context exports.
 * It consolidates exports from entities, value objects, repositories, and unit of work types.
 */

//#region Exports

// Service Aggregate
export {
	Service,
	type ServiceEntityReference,
	type ServiceProps,
} from './service/service/service.aggregate.ts';

// Repository & Unit of Work
export type { ServiceRepository } from './service/service/service.repository.ts';
export type { ServiceUnitOfWork } from './service/service/service.uow.ts';

// Passport & Visa
export type { ServicePassport } from './service/service.passport.ts';
export type { ServiceVisa } from './service/service.visa.ts';

// Domain Permissions
export type { ServiceDomainPermissions } from './service/service.domain-permissions.ts';

//#endregion
