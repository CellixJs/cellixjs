import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { CommunityConverter } from './community.domain-adapter.ts';
import { CommunityRepository } from './community.repository.ts';
import type { CommunityModelType } from '@ocom/data-sources-mongoose-models/community';

type CommunityUnitOfWorkType = (
	communityModel: CommunityModelType,
	passport: Domain.Passport,
) => Domain.Contexts.Community.Community.CommunityUnitOfWork;

export const getCommunityUnitOfWork: CommunityUnitOfWorkType = (
    communityModel: CommunityModelType,
    passport: Domain.Passport
): Domain.Contexts.Community.Community.CommunityUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        communityModel,
        new CommunityConverter(),
        CommunityRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
