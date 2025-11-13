import type * as PassportSeedwork from '@cellix/domain-seedwork/passport-seedwork';
import type { UserDomainPermissions } from './user.domain-permissions.ts';

export interface UserVisa extends PassportSeedwork.Visa<UserDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<UserDomainPermissions>) => boolean,
	): boolean;
}
