import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { Property, PropertyProps } from './property.aggregate.ts';
import type { PropertyRepository } from './property.repository.ts';

export interface PropertyUnitOfWork
	extends DomainSeedwork.UnitOfWork<
	Passport,
	PropertyProps,
	Property<PropertyProps>,
	PropertyRepository<PropertyProps>
>,
	DomainSeedwork.InitializedUnitOfWork<
		Passport,
		PropertyProps,
		Property<PropertyProps>,
		PropertyRepository<PropertyProps>
	> {}
