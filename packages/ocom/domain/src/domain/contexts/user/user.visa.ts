import type { PassportSeedwork } from '@cellix/domain-seedwork';
import type { UserDomainPermissions } from './user.domain-permissions.ts';

export interface UserVisa extends PassportSeedwork.Visa<UserDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<UserDomainPermissions>) => boolean,
	): boolean;
}
