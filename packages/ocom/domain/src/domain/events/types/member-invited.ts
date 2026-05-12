import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export class MemberInvitedEvent extends CustomDomainEventImpl<{
	memberId: string;
	communityId: string;
	email: string;
	invitedBy: string;
	expiresAt: Date;
}> {}
