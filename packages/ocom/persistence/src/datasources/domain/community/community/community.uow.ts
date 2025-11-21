import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityModelType } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { CommunityConverter } from './community.domain-adapter.ts';
import { CommunityRepository } from './community.repository.ts';

export const getCommunityUnitOfWork = (
	endUserModel: CommunityModelType,
	passport: Domain.Passport,
): Domain.Contexts.Community.Community.CommunityUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		endUserModel,
		new CommunityConverter(),
		CommunityRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
