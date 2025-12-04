import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getPropertyUnitOfWork } from './property.uow.ts';
export type PropertyReturnType = {
    PropertyUnitOfWork: Domain.Contexts.Property.Property.PropertyUnitOfWork;
};

type PropertyPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => PropertyReturnType;

export const PropertyPersistence: PropertyPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const PropertyModel = models.Property;
	return {
		PropertyUnitOfWork: getPropertyUnitOfWork(PropertyModel, passport),
	};
};