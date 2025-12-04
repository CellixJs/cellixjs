import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type PropertyReturnType, PropertyPersistence } from './property/index.ts';

type PropertyContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	Property: PropertyReturnType;
};

export const PropertyContextPersistence: PropertyContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
	Property: PropertyPersistence(models, passport),
});