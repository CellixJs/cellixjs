import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { MemberConverter } from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';

import { Member } from '@ocom/domain/contexts/community/member';
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
