import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { VendorUser, VendorUserProps } from './vendor-user.ts';
import type { VendorUserRepository } from './vendor-user.repository.ts';

export interface VendorUserUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		VendorUserProps,
		VendorUser<VendorUserProps>,
		VendorUserRepository<VendorUserProps>
	> {}
