import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface MemberActivatedProps {
	memberId: string;
	communityId: string;
	activatedBy?: string;
}

export class MemberActivatedEvent extends CustomDomainEventImpl<MemberActivatedProps> {}
