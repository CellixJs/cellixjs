import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface ViolationTicketV1CreatedProps {
	id: string;
}

export class ViolationTicketV1CreatedEvent extends CustomDomainEventImpl<ViolationTicketV1CreatedProps> {}
