import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface EndUserCreatedProps {
	userId: string;
}

export class EndUserCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<EndUserCreatedProps> {}
