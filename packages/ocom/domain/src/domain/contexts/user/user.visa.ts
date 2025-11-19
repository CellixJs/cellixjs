import type { Visa } from '@cellix/domain-seedwork/visa';
import type { UserDomainPermissions } from './user.domain-permissions.ts';

export interface UserVisa extends Visa<UserDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<UserDomainPermissions>) => boolean,
	): boolean;
}
