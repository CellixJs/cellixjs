import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getCommunityUnitOfWork } from './community.uow.ts';

export type CommunityReturnType = {
	CommunityUnitOfWork: Domain.Contexts.Community.Community.CommunityUnitOfWork;
};

export const CommunityPersistence: PersistenceFactory<CommunityReturnType> = (models: ModelsContext, passport: Domain.Passport) => {
	const CommunityModel = models.Community;
	return {
		CommunityUnitOfWork: getCommunityUnitOfWork(CommunityModel, passport),
	};
};
