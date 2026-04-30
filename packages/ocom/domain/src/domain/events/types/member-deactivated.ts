import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface MemberDeactivatedProps {
	memberId: string;
	communityId: string;
	deactivatedBy: string;
	reason?: string;
}

export class MemberDeactivatedEvent extends CustomDomainEventImpl<MemberDeactivatedProps> {}
