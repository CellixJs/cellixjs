import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface StaffUserCreatedProps {
	externalId: string;
}

export class StaffUserCreatedEvent extends CustomDomainEventImpl<StaffUserCreatedProps> {}
