import type { Domain } from '@ocom/api-domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCommunityUnitOfWork } from './community.uow.ts';

export const CommunityPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const CommunityModel = models.Community.Community;
	return {
		CommunityUnitOfWork: getCommunityUnitOfWork(CommunityModel, passport),
	};
};
