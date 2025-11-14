import type { Repository } from '@cellix/domain-seedwork/repository';
import type {
	VendorUserRole,
    VendorUserRoleProps,
} from './vendor-user-role.ts';
import type { CommunityEntityReference } from '../../community/community.ts';

export interface VendorUserRoleRepository<props extends VendorUserRoleProps>
	extends Repository<VendorUserRole<props>> {
	getNewInstance(
		roleName: string,
		isDefault: boolean,
		community: CommunityEntityReference,
	): Promise<VendorUserRole<props>>;
	getById(id: string): Promise<VendorUserRole<props>>;
}
