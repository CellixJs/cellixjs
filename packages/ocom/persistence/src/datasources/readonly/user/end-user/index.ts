import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getEndUserReadRepository } from './end-user.read-repository.ts';

export type { EndUserReadRepository } from './end-user.read-repository.ts';

export const EndUserReadRepositoryImpl = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	return {
		EndUserReadRepo: getEndUserReadRepository(models, passport),
	};
};
