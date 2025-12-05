import type { UnitOfWorkFactory } from '@cellix/domain-seedwork/unit-of-work';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { VendorUserRoleConverter } from './vendor-user-role.domain-adapter.ts';
import { VendorUserRoleRepository } from './vendor-user-role.repository.ts';
import type { VendorUserRoleModelType } from '@ocom/data-sources-mongoose-models/role/vendor-user-role';

type VendorUserRoleUnitOfWorkType = UnitOfWorkFactory<
	VendorUserRoleModelType,
	Domain.Passport,
	Domain.Contexts.Community.Role.VendorUserRole.VendorUserRoleUnitOfWork
>;

export const getVendorUserRoleUnitOfWork: VendorUserRoleUnitOfWorkType = (
	vendorUserRoleModel: VendorUserRoleModelType,
	passport: Domain.Passport,
) => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		vendorUserRoleModel,
		new VendorUserRoleConverter(),
		VendorUserRoleRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};