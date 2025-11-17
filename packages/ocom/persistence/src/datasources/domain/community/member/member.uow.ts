import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { MemberConverter } from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';
import type * as Member from '@ocom/domain/contexts/member';

export const getMemberUnitOfWork = (
    endUserModel: Models.Member.MemberModelType,
    passport: Domain.Passport
): Member.MemberUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserModel,
        new MemberConverter(),
        MemberRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
