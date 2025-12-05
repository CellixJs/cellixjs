import type { UnitOfWorkFactory } from '@cellix/domain-seedwork/unit-of-work';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { VendorUserConverter } from './vendor-user.domain-adapter.ts';
import { VendorUserRepository } from './vendor-user.repository.ts';
import type { VendorUserModelType } from '@ocom/data-sources-mongoose-models/user/vendor-user';

type VendorUserUnitOfWorkType = UnitOfWorkFactory<
	VendorUserModelType,
	Domain.Passport,
	Domain.Contexts.User.VendorUser.VendorUserUnitOfWork
>;

export const getVendorUserUnitOfWork: VendorUserUnitOfWorkType = (
	vendorUserModel: VendorUserModelType,
	passport: Domain.Passport,
) => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		vendorUserModel,
		new VendorUserConverter(),
		VendorUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
