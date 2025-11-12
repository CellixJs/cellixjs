import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface PropertyCreatedProps {
	id: string;
}

export class PropertyCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<PropertyCreatedProps> {}
