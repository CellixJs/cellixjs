import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { Property, PropertyProps } from './property.aggregate.ts';
import type { PropertyRepository } from './property.repository.ts';

export interface PropertyUnitOfWork
	extends UnitOfWork<
	Passport,
	PropertyProps,
	Property<PropertyProps>,
	PropertyRepository<PropertyProps>
>,
	InitializedUnitOfWork<
		Passport,
		PropertyProps,
		Property<PropertyProps>,
		PropertyRepository<PropertyProps>
	> {}
