/**
 * Service Ticket V1 Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	ServiceTicketV1,
	type ServiceTicketV1EntityReference,
	type ServiceTicketV1Props,
} from './service-ticket/v1/service-ticket-v1.aggregate.ts';
export type { ServiceTicketV1Repository } from './service-ticket/v1/service-ticket-v1.repository.ts';
export type { ServiceTicketV1UnitOfWork } from './service-ticket/v1/service-ticket-v1.uow.ts';
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for value objects
export * as ValueObjects from './service-ticket/v1/service-ticket-v1.value-objects.ts';
export type { ServiceTicketV1ActivityDetailProps } from './service-ticket/v1/service-ticket-v1-activity-detail.entity.ts';
export type { ServiceTicketV1MessageProps } from './service-ticket/v1/service-ticket-v1-message.entity.ts';

//#region Exports
// All exports are above
//#endregion Exports
