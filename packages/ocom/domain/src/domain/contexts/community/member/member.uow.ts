import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { MemberRepository } from './member.repository.ts';
import type { Member, MemberProps } from './member.ts';

export interface MemberUnitOfWork
	extends UnitOfWork<
			Passport,
			MemberProps,
			Member<MemberProps>,
			MemberRepository<MemberProps>
		>,
		InitializedUnitOfWork<
			Passport,
			MemberProps,
			Member<MemberProps>,
			MemberRepository<MemberProps>
		> {}
