import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Passport } from '@ocom/domain';
import { MemberConverter } from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';
import type { MemberModelType } from '@ocom/data-sources-mongoose-models/member';

export const getMemberUnitOfWork = (
    endUserModel: MemberModelType,
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
