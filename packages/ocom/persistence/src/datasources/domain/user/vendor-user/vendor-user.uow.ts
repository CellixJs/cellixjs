import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { VendorUserConverter } from './vendor-user.domain-adapter.ts';
import { VendorUserRepository } from './vendor-user.repository.ts';
import type { VendorUserUnitOfWork } from '@ocom/domain/contexts/vendor-user';
import type { Passport } from '@ocom/domain/contexts/passport';

export const getVendorUserUnitOfWork = (
	vendorUserModel: Models.User.VendorUserModelType,
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
