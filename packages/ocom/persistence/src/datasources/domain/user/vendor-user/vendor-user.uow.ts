import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { VendorUserUnitOfWork, Passport } from '@ocom/domain';
import { VendorUserConverter } from './vendor-user.domain-adapter.ts';
import { VendorUserRepository } from './vendor-user.repository.ts';
import type { VendorUserModelType } from '@ocom/data-sources-mongoose-models/user/vendor-user';

export const getVendorUserUnitOfWork = (
	vendorUserModel: VendorUserModelType,
	passport: Passport,
): VendorUserUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		vendorUserModel,
		new VendorUserConverter(),
		VendorUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
