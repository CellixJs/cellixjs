import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface CommunityWhiteLabelDomainUpdatedProps {
	communityId: string;
	whiteLabelDomain: string;
	oldWhiteLabelDomain?: string | null;
}

export class CommunityWhiteLabelDomainUpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<CommunityWhiteLabelDomainUpdatedProps> {}
