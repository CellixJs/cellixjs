import type { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';

import {
	EndUserConverter,
} from './end-user.domain-adapter.ts';
import { EndUserRepository } from './end-user.repository.ts';

export const getEndUserUnitOfWork: (
	endUserModel: Models.User.EndUserModelType,
	passport: Domain.Passport,
) => Domain.Contexts.User.EndUser.EndUserUnitOfWork = (endUserModel: Models.User.EndUserModelType, passport: Domain.Passport) => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		endUserModel,
		new EndUserConverter(),
		EndUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};