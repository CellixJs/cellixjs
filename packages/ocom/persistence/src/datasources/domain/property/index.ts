import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { type PropertyReturnType, PropertyPersistence } from './property/index.ts';

interface PropertyContextPersistence {
	Property: PropertyReturnType;
}

type PropertyContextPersistenceType = PersistenceFactory<PropertyContextPersistence>;

export const PropertyContextPersistence: PropertyContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
	Property: PropertyPersistence(models, passport),
});