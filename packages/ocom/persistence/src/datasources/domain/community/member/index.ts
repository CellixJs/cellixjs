import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getMemberUnitOfWork } from './member.uow.ts';

import { Member } from '@ocom/domain/contexts/community/member';
export const MemberPersistence = (models: ModelsContext, passport: Passport) => {
	const MemberModel = models.Member.Member;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
	};
};
