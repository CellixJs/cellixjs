import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface ViolationTicketV1UpdatedProps {
	id: string;
}

export class ViolationTicketV1UpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<ViolationTicketV1UpdatedProps> {}
