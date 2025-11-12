import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface StaffUserCreatedProps {
	externalId: string;
}

export class StaffUserCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<StaffUserCreatedProps> {}
