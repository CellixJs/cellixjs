import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EndUserRole, EndUserRoleProps } from './end-user-role.ts';
import type { CommunityEntityReference } from '../../community/community.ts';

export interface EndUserRoleRepository<props extends EndUserRoleProps>
	extends Repository<EndUserRole<props>> {
	getNewInstance(
		roleName: string,
        isDefault: boolean,
		community: CommunityEntityReference,
	): Promise<EndUserRole<props>>;
	getById(id: string): Promise<EndUserRole<props>>;
}
