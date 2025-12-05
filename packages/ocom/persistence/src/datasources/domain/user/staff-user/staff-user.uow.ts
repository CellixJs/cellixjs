import type { UnitOfWorkFactory } from '@cellix/domain-seedwork/unit-of-work';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { StaffUserConverter } from './staff-user.domain-adapter.ts';
import { StaffUserRepository } from './staff-user.repository.ts';
import type { StaffUserModelType } from '@ocom/data-sources-mongoose-models/user/staff-user';

type StaffUserUnitOfWorkType = UnitOfWorkFactory<
	StaffUserModelType,
	Domain.Passport,
	Domain.Contexts.User.StaffUser.StaffUserUnitOfWork
>;

export const getStaffUserUnitOfWork: StaffUserUnitOfWorkType = (
	staffUserModel: StaffUserModelType,
	passport: Domain.Passport,
) => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		staffUserModel,
		new StaffUserConverter(),
		StaffUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
