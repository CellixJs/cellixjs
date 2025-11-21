import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { EndUserReadRepositoryImpl } from './end-user/index.ts';

export const UserContext = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ({
	EndUser: EndUserReadRepositoryImpl(models, passport),
});
