/**
 * Service Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	Service,
	type ServiceEntityReference,
	type ServiceProps,
} from './service/service.aggregate.ts';
export type { ServiceRepository } from './service/service.repository.ts';
export type { ServiceUnitOfWork } from './service/service.uow.ts';

//#region Exports
// All exports are above
//#endregion Exports
