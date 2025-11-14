import type { Repository } from '@cellix/domain-seedwork/repository';
import type { Member, MemberProps } from './member.ts';
import type { CommunityEntityReference } from '../community/community.ts';

export interface MemberRepository<props extends MemberProps>
	extends Repository<Member<props>> {
	getNewInstance(
		name: string,
		community: CommunityEntityReference,
	): Promise<Member<props>>;
	getById(id: string): Promise<Member<props>>;
	getAssignedToRole(roleId: string): Promise<Member<props>[]>;
	getAll(): Promise<Member<props>[]>;
}
