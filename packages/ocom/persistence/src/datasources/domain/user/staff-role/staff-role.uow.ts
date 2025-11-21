import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { StaffRoleModelType } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { StaffRoleConverter } from './staff-role.domain-adapter.ts';
import { StaffRoleRepository } from './staff-role.repository.ts';

export const getStaffRoleUnitOfWork = (
	staffRoleModel: StaffRoleModelType,
	passport: Domain.Passport,
): Domain.Contexts.User.StaffRole.StaffRoleUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		staffRoleModel,
		new StaffRoleConverter(),
		StaffRoleRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
