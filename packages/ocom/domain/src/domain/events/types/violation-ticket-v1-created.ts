import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface ViolationTicketV1CreatedProps {
	id: string;
}

export class ViolationTicketV1CreatedEvent extends DomainSeedwork.CustomDomainEventImpl<ViolationTicketV1CreatedProps> {}
