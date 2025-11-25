import type { Repository } from '@cellix/domain-seedwork/repository';
import type { CommunityEntityReference } from '../../../community.ts';
import type { MemberEntityReference } from '../../../community.ts';
import type { PropertyEntityReference } from '../../../property.ts';
import type {
	ViolationTicketV1,
	ViolationTicketV1Props,
} from './violation-ticket-v1.aggregate.ts';

export interface ViolationTicketV1Repository<
	props extends ViolationTicketV1Props,
> extends Repository<ViolationTicketV1<props>> {
	getNewInstance(
		title: string,
		description: string,
		community: CommunityEntityReference,
		property: PropertyEntityReference,
		requestor: MemberEntityReference,
		penaltyAmount: number,
	): Promise<ViolationTicketV1<props>>;

	getById(id: string): Promise<ViolationTicketV1<props>>;
}
