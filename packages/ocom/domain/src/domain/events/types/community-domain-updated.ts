import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface CommunityDomainUpdatedProps {
	communityId: string;
	domain: string;
	oldDomain?: string;
}

export class CommunityDomainUpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<CommunityDomainUpdatedProps> {}
