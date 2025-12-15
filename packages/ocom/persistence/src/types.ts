import type { mongooseContextBuilder } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import type { UnitOfWorkFactory } from '@cellix/domain-seedwork/unit-of-work';

export type ModelsContext = ReturnType<typeof mongooseContextBuilder>;

export type PersistenceFactory<T> = UnitOfWorkFactory<ModelsContext, Domain.Passport, T>;