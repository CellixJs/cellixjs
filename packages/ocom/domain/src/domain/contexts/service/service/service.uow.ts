import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { Service, ServiceProps } from './service.ts';
import type { ServiceRepository } from './service.repository.ts';

export interface ServiceUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		ServiceProps,
		Service<ServiceProps>,
		ServiceRepository<ServiceProps>
	>,
	DomainSeedwork.InitializedUnitOfWork<
		Passport,
		ServiceProps,
		Service<ServiceProps>,
		ServiceRepository<ServiceProps>
	> {}
