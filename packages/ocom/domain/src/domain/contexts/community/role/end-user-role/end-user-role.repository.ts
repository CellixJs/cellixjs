import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { EndUserRole, EndUserRoleProps } from './end-user-role.ts';
import type { CommunityEntityReference } from '../../community/community.ts';

export interface EndUserRoleRepository<props extends EndUserRoleProps>
	extends DomainSeedwork.Repository<EndUserRole<props>> {
	getNewInstance(
		roleName: string,
        isDefault: boolean,
		community: CommunityEntityReference,
	): Promise<EndUserRole<props>>;
	getById(id: string): Promise<EndUserRole<props>>;
}
