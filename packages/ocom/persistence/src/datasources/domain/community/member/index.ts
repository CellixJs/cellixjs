import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getMemberUnitOfWork } from './member.uow.ts';
import { getMemberInvitationUnitOfWork } from './member-invitation.uow.ts';

export const MemberPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const MemberModel = models.Member;
	const MemberInvitationModel = models.MemberInvitation;
	return {
		MemberUnitOfWork: getMemberUnitOfWork(MemberModel, passport),
		MemberInvitationUnitOfWork: getMemberInvitationUnitOfWork(MemberInvitationModel, passport),
	};
};
