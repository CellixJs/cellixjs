import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { StaffUserConverter } from './staff-user.domain-adapter.ts';
import { StaffUserRepository } from './staff-user.repository.ts';

export const getStaffUserUnitOfWork = (
	staffUserModel: Models.User.StaffUserModelType,
	passport: Passport,
): StaffUserUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		staffUserModel,
		new StaffUserConverter(),
		StaffUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
