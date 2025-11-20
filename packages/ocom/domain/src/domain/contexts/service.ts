/**
 * Service Context - Aggregate Exports
 * 
 * This file serves as the single entry point for all exports from the Service bounded context.
 * It consolidates exports from Service aggregate root, repositories, unit of work, and related types.
 */

//#region Exports

// Service aggregate, types, and contracts
export {
	Service,
	type ServiceEntityReference,
	type ServiceProps,
} from './service/service/service.aggregate.ts';
export type { ServiceRepository } from './service/service/service.repository.ts';
export type { ServiceUnitOfWork } from './service/service/service.uow.ts';

// Service context passport
export type { ServicePassport } from './service/service.passport.ts';

//#endregion Exports
