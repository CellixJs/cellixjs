import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface EndUserCreatedProps {
	userId: string;
}

export class EndUserCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<EndUserCreatedProps> {}
