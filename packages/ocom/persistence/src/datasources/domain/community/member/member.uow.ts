import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { MemberConverter } from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';
import type { MemberModelType } from '@ocom/data-sources-mongoose-models/member';

type MemberUnitOfWorkType = (
    memberModel: MemberModelType,
    passport: Domain.Passport,
) => Domain.Contexts.Community.Member.MemberUnitOfWork;

export const getMemberUnitOfWork: MemberUnitOfWorkType = (
    memberModel: MemberModelType,
    passport: Domain.Passport
): Domain.Contexts.Community.Member.MemberUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        memberModel,
        new MemberConverter(),
        MemberRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
