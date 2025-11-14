import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface CommunityWhiteLabelDomainUpdatedProps {
	communityId: string;
	whiteLabelDomain: string;
	oldWhiteLabelDomain?: string | null;
}

export class CommunityWhiteLabelDomainUpdatedEvent extends CustomDomainEventImpl<CommunityWhiteLabelDomainUpdatedProps> {}
