import type { Repository } from '@cellix/domain-seedwork/repository';
import type { CommunityEntityReference } from '../../../community/community/index.ts';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { PropertyEntityReference } from '../../../property/property/index.ts';
import type { ServiceTicketV1, ServiceTicketV1Props } from './service-ticket-v1.aggregate.ts';
import type * as ValueObjects from './service-ticket-v1.value-objects.ts';

export interface ServiceTicketV1Repository<props extends ServiceTicketV1Props>
	extends Repository<ServiceTicketV1<props>> {
	getNewInstance(
		title: ValueObjects.Title,
		description: ValueObjects.Description,
		community: CommunityEntityReference,
		requestor: MemberEntityReference,
		property?: PropertyEntityReference,
	): Promise<ServiceTicketV1<props>>;
	getById(id: string): Promise<ServiceTicketV1<props>>;
}