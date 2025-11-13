import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface ServiceTicketV1DeletedProps {
	id: string;
}

export class ServiceTicketV1DeletedEvent extends DomainSeedwork.CustomDomainEventImpl<ServiceTicketV1DeletedProps> {}
