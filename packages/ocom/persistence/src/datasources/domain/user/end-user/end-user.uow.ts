import type { DomainDataSource, Passport } from '@ocom/domain';

import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import {
	EndUserConverter,
} from './end-user.domain-adapter.ts';
import { EndUserRepository } from './end-user.repository.ts';
import type { EndUserModelType } from '@ocom/data-sources-mongoose-models/user/end-user';

export const getEndUserUnitOfWork: (
	endUserModel: EndUserModelType,
	passport: Passport,
) => Domain.Contexts.User.EndUser.EndUserUnitOfWork = (endUserModel: EndUserModelType, passport: Passport) => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		endUserModel,
		new EndUserConverter(),
		EndUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};