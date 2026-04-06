import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface MemberAddedProps {
	memberId: string;
	communityId: string;
	memberName: string;
}

export class MemberAddedEvent extends CustomDomainEventImpl<MemberAddedProps> {}
