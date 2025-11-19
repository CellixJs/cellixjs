import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface ServiceTicketV1UpdatedProps {
	id: string;
}

export class ServiceTicketV1UpdatedEvent extends CustomDomainEventImpl<ServiceTicketV1UpdatedProps> {}
