import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface PropertyUpdatedProps {
	id: string;
}

export class PropertyUpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<PropertyUpdatedProps> {}
