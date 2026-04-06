import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface MemberInvitedProps {
	memberId: string;
	communityId: string;
	email: string;
	invitedBy: string;
	expiresAt: Date;
}

export class MemberInvitedEvent extends CustomDomainEventImpl<MemberInvitedProps> {}
