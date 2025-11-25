import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { DomainDataSource, Passport } from '@ocom/domain';
import { StaffUserConverter } from './staff-user.domain-adapter.ts';
import { StaffUserRepository } from './staff-user.repository.ts';
import type { StaffUserModelType } from '@ocom/data-sources-mongoose-models/user/staff-user';

export const getStaffUserUnitOfWork = (
	staffUserModel: StaffUserModelType,
	passport: Passport,
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
