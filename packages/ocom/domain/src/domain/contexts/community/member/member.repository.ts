import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Member, MemberProps } from './member.ts';
import type { CommunityEntityReference } from '../community/community.ts';

export interface MemberRepository<props extends MemberProps>
	extends DomainSeedwork.Repository<Member<props>> {
	getNewInstance(
		name: string,
		community: CommunityEntityReference,
	): Promise<Member<props>>;
	getById(id: string): Promise<Member<props>>;
	getAssignedToRole(roleId: string): Promise<Member<props>[]>;
	getAll(): Promise<Member<props>[]>;
}
