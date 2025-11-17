import type { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import {
	EndUserConverter,
} from './end-user.domain-adapter.ts';
import { EndUserRepository } from './end-user.repository.ts';
import type * as EndUser from '@ocom/domain/contexts/end-user';

export const getEndUserUnitOfWork: (
	endUserModel: Models.User.EndUserModelType,
	passport: Domain.Passport,
) => EndUser.EndUserUnitOfWork = (endUserModel: Models.User.EndUserModelType, passport: Domain.Passport) => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		endUserModel,
		new EndUserConverter(),
		EndUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};