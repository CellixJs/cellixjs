import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { CommunityConverter } from './community.domain-adapter.ts';
import { CommunityRepository } from './community.repository.ts';

import { Community } from '@ocom/domain/contexts/community/community';
export const getCommunityUnitOfWork = (
    endUserModel: Models.Community.CommunityModelType,
    passport: Passport
): CommunityUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserModel,
        new CommunityConverter(),
        CommunityRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
