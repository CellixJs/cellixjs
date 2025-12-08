import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getMemberUnitOfWork } from './member.uow.ts';
export type MemberReturnType = {
	MemberUnitOfWork: Domain.Contexts.Community.Member.MemberUnitOfWork;
};

export const MemberPersistence: PersistenceFactory<MemberReturnType> = (models: ModelsContext, passport: Domain.Passport) => {
	const MemberModel = models.Member;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
	};
};
