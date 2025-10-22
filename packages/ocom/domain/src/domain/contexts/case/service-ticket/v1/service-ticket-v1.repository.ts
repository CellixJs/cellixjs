import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityEntityReference } from '../../../community/community/index.ts';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { PropertyEntityReference } from '../../../property/property/index.ts';
import type { ServiceTicketV1, ServiceTicketV1Props } from './service-ticket-v1.aggregate.ts';

export interface ServiceTicketV1Repository<props extends ServiceTicketV1Props>
	extends DomainSeedwork.Repository<ServiceTicketV1<props>> {
	getNewInstance(
		title: string,
		description: string,
		community: CommunityEntityReference,
		property: PropertyEntityReference,
		requestor: MemberEntityReference,
	): Promise<ServiceTicketV1<props>>;
	getById(id: string): Promise<ServiceTicketV1<props>>;
}