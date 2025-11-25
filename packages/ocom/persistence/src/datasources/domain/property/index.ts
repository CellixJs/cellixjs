import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import * as Property from './property/index.ts';

export const PropertyContextPersistence = (models: ModelsContext, passport: Passport) => ({
	Property: Property.PropertyPersistence(models, passport),
});