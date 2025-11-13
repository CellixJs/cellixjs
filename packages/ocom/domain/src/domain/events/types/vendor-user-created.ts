import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface VendorUserCreatedProps {
	userId: string;
}

export class VendorUserCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<VendorUserCreatedProps> {}
