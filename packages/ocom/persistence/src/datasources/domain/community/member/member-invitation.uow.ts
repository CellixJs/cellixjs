import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { InProcEventBusInstance, NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { MemberInvitationConverter } from './member-invitation.domain-adapter.ts';
import { MemberInvitationRepository } from './member-invitation.repository.ts';
import type { MemberInvitationModelType } from '@ocom/data-sources-mongoose-models/member/member-invitation';

export const getMemberInvitationUnitOfWork = (model: MemberInvitationModelType, passport: Domain.Passport): Domain.Contexts.Community.Member.MemberInvitationUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(InProcEventBusInstance, NodeEventBusInstance, model, new MemberInvitationConverter(), MemberInvitationRepository);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
