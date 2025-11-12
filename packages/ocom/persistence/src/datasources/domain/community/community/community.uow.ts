import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { CommunityConverter } from './community.domain-adapter.ts';
import { CommunityRepository } from './community.repository.ts';

export const getCommunityUnitOfWork = (
    endUserModel: Models.Community.CommunityModelType,
    passport: Domain.Passport
): Domain.Contexts.Community.Community.CommunityUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserModel,
        new CommunityConverter(),
        CommunityRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
