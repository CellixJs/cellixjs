import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
export interface CommunityCreatedProps {
	communityId: string;
}

export class CommunityCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<CommunityCreatedProps> {}
