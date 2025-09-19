import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface StaffUserCreatedProps {
	externalId: string;
}

export class StaffUserCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<StaffUserCreatedProps> {}
