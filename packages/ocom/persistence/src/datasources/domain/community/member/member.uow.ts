import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { MemberModelType } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { MemberConverter } from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';

export const getMemberUnitOfWork = (
	endUserModel: MemberModelType,
	passport: Domain.Passport,
): Domain.Contexts.Community.Member.MemberUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		endUserModel,
		new MemberConverter(),
		MemberRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
