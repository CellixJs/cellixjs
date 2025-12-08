import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getPropertyUnitOfWork } from './property.uow.ts';
export type PropertyReturnType = {
    PropertyUnitOfWork: Domain.Contexts.Property.Property.PropertyUnitOfWork;
};

type PropertyPersistenceType = PersistenceFactory<PropertyReturnType>;

export const PropertyPersistence: PropertyPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const PropertyModel = models.Property;
	return {
		PropertyUnitOfWork: getPropertyUnitOfWork(PropertyModel, passport),
	};
};