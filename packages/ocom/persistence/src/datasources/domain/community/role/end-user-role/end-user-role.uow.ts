import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { EndUserRoleModelType } from '@ocom/data-sources-mongoose-models/user';
import type { Domain } from '@ocom/domain';
import { EndUserRoleConverter } from './end-user-role.domain-adapter.ts';
import { EndUserRoleRepository } from './end-user-role.repository.ts';

export const getEndUserRoleUnitOfWork = (
	endUserRoleModel: EndUserRoleModelType,
	passport: Domain.Passport,
): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		endUserRoleModel,
		new EndUserRoleConverter(),
		EndUserRoleRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
