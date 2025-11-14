import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CommunityDomainPermissions } from './community.domain-permissions.ts';

export interface CommunityVisa extends Visa<CommunityDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<CommunityDomainPermissions>) => boolean,
	): boolean;
}
