import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getMemberUnitOfWork } from './member.uow.ts';
export type MemberReturnType = {
	MemberUnitOfWork: Domain.Contexts.Community.Member.MemberUnitOfWork;
};

type MemberPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => MemberReturnType;

export const MemberPersistence: MemberPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const MemberModel = models.Member;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
	};
};
