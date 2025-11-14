import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { StaffUserRepository } from './staff-user.repository.ts';
import type { StaffUser, StaffUserProps } from './staff-user.ts';

export interface StaffUserUnitOfWork
	extends UnitOfWork<
			Passport,
			StaffUserProps,
			StaffUser<StaffUserProps>,
			StaffUserRepository<StaffUserProps>
		>,
		InitializedUnitOfWork<
			Passport,
			StaffUserProps,
			StaffUser<StaffUserProps>,
			StaffUserRepository<StaffUserProps>
		> {}
