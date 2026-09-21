import { InProcEventBusInstance, NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityConfigModelType } from '@ocom/data-sources-mongoose-models/community/community-config';
import type { Domain } from '@ocom/domain';
import { CommunityConfigConverter } from './community-config.domain-adapter.ts';
import { CommunityConfigRepository } from './community-config.repository.ts';

export const getCommunityConfigUnitOfWork = (communityConfigModel: CommunityConfigModelType, passport: Domain.Passport): Domain.Contexts.Community.CommunityConfig.CommunityConfigUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(InProcEventBusInstance, NodeEventBusInstance, communityConfigModel, new CommunityConfigConverter(), CommunityConfigRepository);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
