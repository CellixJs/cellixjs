import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface ViolationTicketV1DeletedEventProps {
	id: string;
}

export class ViolationTicketV1DeletedEvent extends DomainSeedwork.CustomDomainEventImpl<ViolationTicketV1DeletedEventProps> {}
