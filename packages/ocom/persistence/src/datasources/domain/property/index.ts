import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type PropertyReturnType, PropertyPersistence } from './property/index.ts';

interface PropertyContextPersistence {
	Property: PropertyReturnType;
}

type PropertyContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => PropertyContextPersistence;

export const PropertyContextPersistence: PropertyContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
	Property: PropertyPersistence(models, passport),
});