import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getVendorUserUnitOfWork } from './vendor-user.uow.ts';

export const VendorUserPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const vendorUserModel = models.User?.VendorUser;
	if (!vendorUserModel) {
		throw new Error('VendorUser model is not available in the mongoose context');
	}

	return {
		VendorUserUnitOfWork: getVendorUserUnitOfWork(vendorUserModel, passport),
	};
};
