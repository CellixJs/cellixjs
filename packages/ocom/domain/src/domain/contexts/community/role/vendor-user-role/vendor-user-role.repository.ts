import type {
	VendorUserRole,
    VendorUserRoleProps,
} from './vendor-user-role.ts';
import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityEntityReference } from '../../community/community.ts';

export interface VendorUserRoleRepository<props extends VendorUserRoleProps>
	extends DomainSeedwork.Repository<VendorUserRole<props>> {
	getNewInstance(
		roleName: string,
		isDefault: boolean,
		community: CommunityEntityReference,
	): Promise<VendorUserRole<props>>;
	getById(id: string): Promise<VendorUserRole<props>>;
}
