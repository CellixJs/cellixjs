import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { Service, ServiceProps } from './service.aggregate.ts';
import type { ServiceRepository } from './service.repository.ts';

export interface ServiceUnitOfWork
	extends UnitOfWork<
		Passport,
		ServiceProps,
		Service<ServiceProps>,
		ServiceRepository<ServiceProps>
	>,
	InitializedUnitOfWork<
		Passport,
		ServiceProps,
		Service<ServiceProps>,
		ServiceRepository<ServiceProps>
	> {}
