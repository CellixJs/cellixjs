// #region Exports - Service Context Aggregate
// This file consolidates all exports from the Service bounded context.
// No barrel files (index.ts) are used in this context.

export {
	Service,
	type ServiceEntityReference,
	type ServiceProps,
} from './service/service/service.aggregate.ts';
export type { ServiceRepository } from './service/service/service.repository.ts';
export type { ServiceUnitOfWork } from './service/service/service.uow.ts';
export type { ServicePassport } from './service/service.passport.ts';
export type { ServiceVisa } from './service/service.visa.ts';
export type { ServiceDomainPermissions } from './service/service.domain-permissions.ts';

// #endregion
