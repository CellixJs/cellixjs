import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCommunityConfigUnitOfWork } from './community-config.uow.ts';

export const CommunityConfigPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const CommunityConfigModel = models.CommunityConfig;
	return {
		CommunityConfigUnitOfWork: getCommunityConfigUnitOfWork(CommunityConfigModel, passport),
	};
};
