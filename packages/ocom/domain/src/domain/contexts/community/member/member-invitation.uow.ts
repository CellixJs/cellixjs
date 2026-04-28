import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { MemberInvitationRepository } from './member-invitation.repository.ts';
import type { MemberInvitation, MemberInvitationProps } from './member-invitation.ts';

export interface MemberInvitationUnitOfWork
	extends UnitOfWork<Passport, MemberInvitationProps, MemberInvitation<MemberInvitationProps>, MemberInvitationRepository<MemberInvitationProps>>,
		InitializedUnitOfWork<Passport, MemberInvitationProps, MemberInvitation<MemberInvitationProps>, MemberInvitationRepository<MemberInvitationProps>> {}
