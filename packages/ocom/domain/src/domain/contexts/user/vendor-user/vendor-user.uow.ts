import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { VendorUserRepository } from './vendor-user.repository.ts';
import type { VendorUser, VendorUserProps } from './vendor-user.ts';

export interface VendorUserUnitOfWork
	extends DomainSeedwork.UnitOfWork<
			Passport,
			VendorUserProps,
			VendorUser<VendorUserProps>,
			VendorUserRepository<VendorUserProps>
		>,
		DomainSeedwork.InitializedUnitOfWork<
			Passport,
			VendorUserProps,
			VendorUser<VendorUserProps>,
			VendorUserRepository<VendorUserProps>
		> {}
