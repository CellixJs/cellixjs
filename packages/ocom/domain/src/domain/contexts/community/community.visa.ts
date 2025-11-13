import type * as PassportSeedwork from '@cellix/domain-seedwork/passport-seedwork';
import type { CommunityDomainPermissions } from './community.domain-permissions.ts';

export interface CommunityVisa
	extends PassportSeedwork.Visa<CommunityDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<CommunityDomainPermissions>) => boolean,
	): boolean;
}
