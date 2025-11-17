import type { ModelsContext } from '../../../../index.ts';
import { getVendorUserUnitOfWork } from './vendor-user.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const VendorUserPersistence = (models: ModelsContext, passport: Passport) => {
	const vendorUserModel = models.User?.VendorUser;
	if (!vendorUserModel) {
		throw new Error('VendorUser model is not available in the mongoose context');
	}

	return {
		VendorUserUnitOfWork: getVendorUserUnitOfWork(vendorUserModel, passport),
	};
};
