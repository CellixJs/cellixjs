import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCommunityUnitOfWork } from './community.uow.ts';

export type CommunityReturnType = {
	CommunityUnitOfWork: Domain.Contexts.Community.Community.CommunityUnitOfWork;
};

type CommunityPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => CommunityReturnType;

export const CommunityPersistence: CommunityPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const CommunityModel = models.Community;
	return {
		CommunityUnitOfWork: getCommunityUnitOfWork(CommunityModel, passport),
	};
};
