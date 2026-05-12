import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface MemberRemovedProps {
	memberId: string;
	communityId: string;
	removedBy: string;
	reason?: string;
}

export class MemberRemovedEvent extends CustomDomainEventImpl<MemberRemovedProps> {}
