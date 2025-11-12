import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityEntityReference } from '../../community/community/community.ts';
import type { Property, PropertyProps } from './property.aggregate.ts';

export interface PropertyRepository<props extends PropertyProps>
	extends DomainSeedwork.Repository<Property<props>> {
	getNewInstance(
		propertyName: string,
		community: CommunityEntityReference,
	): Promise<Property<props>>;
	getById(id: string): Promise<Property<props>>;
	getAll(): Promise<ReadonlyArray<Property<props>>>;
}
