import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface EndUserCreatedProps {
	userId: string;
}

export class EndUserCreatedEvent extends CustomDomainEventImpl<EndUserCreatedProps> {}
