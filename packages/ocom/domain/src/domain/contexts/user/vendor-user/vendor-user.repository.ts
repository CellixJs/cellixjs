import type { VendorUser, VendorUserProps } from './vendor-user.ts';
import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface VendorUserRepository<props extends VendorUserProps>
	extends DomainSeedwork.Repository<VendorUser<props>> {
	delete(id: string): Promise<void>;
	getByExternalId(externalId: string): Promise<VendorUser<props>>;
	getNewInstance(
		externalId: string,
		lastName: string,
		restOfName?: string,
	): Promise<VendorUser<props>>;
}
