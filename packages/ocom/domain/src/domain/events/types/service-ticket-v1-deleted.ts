import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface ServiceTicketV1DeletedProps {
	id: string;
}

export class ServiceTicketV1DeletedEvent extends CustomDomainEventImpl<ServiceTicketV1DeletedProps> {}
