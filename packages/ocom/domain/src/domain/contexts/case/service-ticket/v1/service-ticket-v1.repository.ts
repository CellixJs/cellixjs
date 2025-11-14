import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityEntityReference } from '../../../community/community/community.ts';
import type { MemberEntityReference } from '../../../community/member/member.ts';
import type { PropertyEntityReference } from '../../../property/property/property.aggregate.ts';
import type { ServiceTicketV1, ServiceTicketV1Props } from './service-ticket-v1.aggregate.ts';
import type * as ValueObjects from './service-ticket-v1.value-objects.ts';

export interface ServiceTicketV1Repository<props extends ServiceTicketV1Props>
	extends DomainSeedwork.Repository<ServiceTicketV1<props>> {
	getNewInstance(
		title: ValueObjects.Title,
		description: ValueObjects.Description,
		community: CommunityEntityReference,
		requestor: MemberEntityReference,
		property?: PropertyEntityReference,
	): Promise<ServiceTicketV1<props>>;
	getById(id: string): Promise<ServiceTicketV1<props>>;
}