import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { StaffRoleConverter } from './staff-role.domain-adapter.ts';
import { StaffRoleRepository } from './staff-role.repository.ts';

export const getStaffRoleUnitOfWork = (
	staffRoleModel: Models.Role.StaffRoleModelType,
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
