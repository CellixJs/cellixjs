import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getPropertyUnitOfWork } from './property.uow.ts';

export const PropertyPersistence = (models: ModelsContext, passport: Passport) => {
	const PropertyModel = models.Property.Property;
	return {
		PropertyUnitOfWork: getPropertyUnitOfWork(PropertyModel, passport),
	};
};