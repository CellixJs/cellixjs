import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface PropertyUpdatedProps {
	id: string;
}

export class PropertyUpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<PropertyUpdatedProps> {}
