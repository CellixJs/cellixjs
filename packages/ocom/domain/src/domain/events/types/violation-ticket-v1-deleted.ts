import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface ViolationTicketV1DeletedEventProps {
	id: string;
}

export class ViolationTicketV1DeletedEvent extends CustomDomainEventImpl<ViolationTicketV1DeletedEventProps> {}
