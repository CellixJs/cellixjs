import type { ModelsContext } from '../../../../index.ts';
import { getCommunityUnitOfWork } from './community.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const CommunityPersistence = (models: ModelsContext, passport: Passport) => {
	const CommunityModel = models.Community.Community;
	return {
		CommunityUnitOfWork: getCommunityUnitOfWork(CommunityModel, passport),
	};
};
