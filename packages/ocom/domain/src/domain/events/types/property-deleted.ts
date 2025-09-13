import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface PropertyDeletedEventProps {
	id: string;
}

export class PropertyDeletedEvent extends DomainSeedwork.CustomDomainEventImpl<PropertyDeletedEventProps> {}
