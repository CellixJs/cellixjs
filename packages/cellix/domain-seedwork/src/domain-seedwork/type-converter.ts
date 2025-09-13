import type { AggregateRoot } from './aggregate-root.js';
import type { DomainEntityProps } from './domain-entity.js';

export interface TypeConverter<
	PersistenceType,
	DomainPropType extends DomainEntityProps,
	PassportType,
	DomainType extends AggregateRoot<DomainPropType, PassportType>,
> {
	toDomain(
		persistenceType: PersistenceType,
		passport: PassportType,
	): DomainType;
	toPersistence(domainType: DomainType): PersistenceType;
	toAdapter(persistenceType: PersistenceType | DomainType): DomainPropType;
}
