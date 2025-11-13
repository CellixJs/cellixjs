import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { StaffRoleConverter } from './staff-role.domain-adapter.ts';
import { StaffRoleRepository } from './staff-role.repository.ts';

export const getStaffRoleUnitOfWork = (
	staffRoleModel: Models.Role.StaffRoleModelType,
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
