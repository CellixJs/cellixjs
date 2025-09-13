import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface VendorUserCreatedProps {
	userId: string;
}

export class VendorUserCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<VendorUserCreatedProps> {}
