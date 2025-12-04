import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getVendorUserUnitOfWork } from './vendor-user.uow.ts';

export type VendorUserReturnType = {
    VendorUserUnitOfWork: Domain.Contexts.User.VendorUser.VendorUserUnitOfWork;
};

export type VendorUserPersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => VendorUserReturnType;

export const VendorUserPersistence: VendorUserPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const vendorUserModel = models.VendorUser;
	if (!vendorUserModel) {
		throw new Error('VendorUser model is not available in the mongoose context');
	}

	return {
		VendorUserUnitOfWork: getVendorUserUnitOfWork(vendorUserModel, passport),
	};
};
