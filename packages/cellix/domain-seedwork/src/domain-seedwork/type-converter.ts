import type { AggregateRoot } from './aggregate-root.ts';
import type { DomainEntityProps } from './domain-entity.ts';

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
