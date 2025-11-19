import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { EndUserRepository } from './end-user.repository.ts';
import type { EndUser, EndUserProps } from './end-user.ts';

export interface EndUserUnitOfWork
	extends UnitOfWork<
			Passport,
			EndUserProps,
			EndUser<EndUserProps>,
			EndUserRepository<EndUserProps>
		>,
		InitializedUnitOfWork<
			Passport,
			EndUserProps,
			EndUser<EndUserProps>,
			EndUserRepository<EndUserProps>
		> {}
