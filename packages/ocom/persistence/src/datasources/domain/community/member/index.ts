import type { ModelsContext } from '../../../../index.ts';
import { getMemberUnitOfWork } from './member.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const MemberPersistence = (models: ModelsContext, passport: Passport) => {
	const MemberModel = models.Member.Member;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
	};
};
