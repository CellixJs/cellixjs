import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { MemberConverter } from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';
import type { MemberUnitOfWork } from '@ocom/domain/contexts/member';
import type { Passport } from '@ocom/domain/contexts/passport';

export const getMemberUnitOfWork = (
    endUserModel: Models.Member.MemberModelType,
    passport: Passport
): MemberUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserModel,
        new MemberConverter(),
        MemberRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
