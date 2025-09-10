import { MongooseSeedwork } from '@cellix/data-sources-mongoose';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/api-data-sources-mongoose-models';
import type { Domain } from '@ocom/api-domain';
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
