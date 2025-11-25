import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getMemberUnitOfWork } from './member.uow.ts';

export const MemberPersistence = (models: ModelsContext, passport: Passport) => {
	const MemberModel = models.Member;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
	};
};
