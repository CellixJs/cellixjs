import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { StaffUserConverter } from './staff-user.domain-adapter.ts';
import { StaffUserRepository } from './staff-user.repository.ts';

export const getStaffUserUnitOfWork = (
	staffUserModel: Models.User.StaffUserModelType,
	passport: Domain.Passport,
): Domain.Contexts.User.StaffUser.StaffUserUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		staffUserModel,
		new StaffUserConverter(),
		StaffUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
