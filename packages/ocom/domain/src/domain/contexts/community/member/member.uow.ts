import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { MemberRepository } from './member.repository.ts';
import type { Member, MemberProps } from './member.ts';

export interface MemberUnitOfWork
	extends DomainSeedwork.UnitOfWork<
			Passport,
			MemberProps,
			Member<MemberProps>,
			MemberRepository<MemberProps>
		>,
		DomainSeedwork.InitializedUnitOfWork<
			Passport,
			MemberProps,
			Member<MemberProps>,
			MemberRepository<MemberProps>
		> {}
