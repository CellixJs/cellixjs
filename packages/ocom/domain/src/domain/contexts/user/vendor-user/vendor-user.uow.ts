import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { VendorUserRepository } from './vendor-user.repository.ts';
import type { VendorUser, VendorUserProps } from './vendor-user.ts';

export interface VendorUserUnitOfWork
	extends UnitOfWork<
			Passport,
			VendorUserProps,
			VendorUser<VendorUserProps>,
			VendorUserRepository<VendorUserProps>
		>,
		InitializedUnitOfWork<
			Passport,
			VendorUserProps,
			VendorUser<VendorUserProps>,
			VendorUserRepository<VendorUserProps>
		> {}
