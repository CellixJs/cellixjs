/**
 * Service Domain Context Aggregate
 * 
 * This file consolidates all exports from the Service bounded context.
 * 
 * All entities, repositories, unit of work types, and value objects
 * are exported from this single entry point.
 */

//#region Service
export { Service, type ServiceEntityReference, type ServiceProps } from './service/service/service.aggregate.ts';
export type { ServiceRepository } from './service/service/service.repository.ts';
export type { ServiceUnitOfWork } from './service/service/service.uow.ts';
//#endregion
