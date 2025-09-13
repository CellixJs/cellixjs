import type { PassportSeedwork } from '@cellix/domain-seedwork';
import type { CommunityDomainPermissions } from './community.domain-permissions.ts';

export interface CommunityVisa
	extends PassportSeedwork.Visa<CommunityDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<CommunityDomainPermissions>) => boolean,
	): boolean;
}
