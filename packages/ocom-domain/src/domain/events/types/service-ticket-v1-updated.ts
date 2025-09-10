import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface ServiceTicketV1UpdatedProps {
	id: string;
}

export class ServiceTicketV1UpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<ServiceTicketV1UpdatedProps> {}
