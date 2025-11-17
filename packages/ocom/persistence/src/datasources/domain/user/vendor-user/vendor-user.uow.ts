import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { VendorUserConverter } from './vendor-user.domain-adapter.ts';
import { VendorUserRepository } from './vendor-user.repository.ts';
import type * as VendorUser from '@ocom/domain/contexts/vendor-user';

export const getVendorUserUnitOfWork = (
	vendorUserModel: Models.User.VendorUserModelType,
	passport: Domain.Passport,
): VendorUser.VendorUserUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		vendorUserModel,
		new VendorUserConverter(),
		VendorUserRepository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
