import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { DomainDataSource, Passport } from '@ocom/domain';
import { CommunityConverter } from './community.domain-adapter.ts';
import { CommunityRepository } from './community.repository.ts';
import type { CommunityModelType } from '@ocom/data-sources-mongoose-models/community';

export const getCommunityUnitOfWork = (
    endUserModel: CommunityModelType,
    passport: Passport
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
