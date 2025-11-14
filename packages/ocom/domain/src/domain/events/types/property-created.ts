import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface PropertyCreatedProps {
	id: string;
}

export class PropertyCreatedEvent extends CustomDomainEventImpl<PropertyCreatedProps> {}
