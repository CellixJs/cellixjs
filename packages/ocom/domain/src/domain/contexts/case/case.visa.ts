import type { PassportSeedwork } from '@cellix/domain-seedwork';
import type { CaseDomainPermissions } from './case.domain-permissions.ts';

export interface CaseVisa extends PassportSeedwork.Visa<CaseDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
	): boolean;
}