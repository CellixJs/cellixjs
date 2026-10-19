import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface CommunityIpAddressUpdatedProps {
	communityId: string;
	ipAddress: string;
}
export class CommunityIpAddressUpdatedEvent extends CustomDomainEventImpl<CommunityIpAddressUpdatedProps> {}
