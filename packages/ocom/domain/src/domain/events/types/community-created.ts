import { DomainSeedwork } from '@cellix/domain-seedwork';
export interface CommunityCreatedProps {
	communityId: string;
}

export class CommunityCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<CommunityCreatedProps> {}
