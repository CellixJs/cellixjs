import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Passport } from '@ocom/domain';
import { StaffRoleConverter } from './staff-role.domain-adapter.ts';
import { StaffRoleRepository } from './staff-role.repository.ts';
import type { StaffRoleModelType } from '@ocom/data-sources-mongoose-models/role/staff-role';

export const getStaffRoleUnitOfWork = (
	staffRoleModel: StaffRoleModelType,
	passport: Passport,
): StaffRoleUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		staffRoleModel,
		new StaffRoleConverter(),
		StaffRoleRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
