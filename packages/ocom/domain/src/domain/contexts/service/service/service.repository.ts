import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityEntityReference } from '../../community/community/community.ts';
import type { Service, ServiceProps } from './service.aggregate.ts';

export interface ServiceRepository<props extends ServiceProps>
	extends DomainSeedwork.Repository<Service<props>> {
	getNewInstance(
		serviceName: string,
		description: string,
		community: CommunityEntityReference,
	): Promise<Service<props>>;
	getById(id: string): Promise<Service<props>>;
}
