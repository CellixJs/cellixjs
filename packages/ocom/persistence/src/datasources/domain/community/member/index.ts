import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getMemberUnitOfWork } from './member.uow.ts';

export const MemberPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const MemberModel = models.Community.Member;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
	};
};
