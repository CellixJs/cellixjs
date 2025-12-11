import type { mongooseContextBuilder } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';

export type ModelsContext = ReturnType<typeof mongooseContextBuilder>;

export type PersistenceFactory<T> = (models: ModelsContext, passport: Domain.Passport) => T;