import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getCommunityUnitOfWork } from './community.uow.ts';

export type CommunityReturnType = {
	CommunityUnitOfWork: Domain.Contexts.Community.Community.CommunityUnitOfWork;
};

type CommunityPersistenceType = PersistenceFactory<CommunityReturnType>;

export const CommunityPersistence: CommunityPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const CommunityModel = models.Community;
	return {
		CommunityUnitOfWork: getCommunityUnitOfWork(CommunityModel, passport),
	};
};
