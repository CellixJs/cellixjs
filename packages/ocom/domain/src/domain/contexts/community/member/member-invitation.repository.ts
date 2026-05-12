import type { Repository } from '@cellix/domain-seedwork/repository';
import type { MemberInvitation, MemberInvitationProps } from './member-invitation.ts';

export interface MemberInvitationRepository<props extends MemberInvitationProps> extends Repository<MemberInvitation<props>> {
	getNewInstance(communityId: string, email: string, message: string, expiresAt: Date, invitedById: string): Promise<MemberInvitation<props>>;
	getById(id: string): Promise<MemberInvitation<props>>;
	getByCommunityId(communityId: string): Promise<MemberInvitation<props>[]>;
}
