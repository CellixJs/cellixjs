import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CaseDomainPermissions } from './case.domain-permissions.ts';

export interface CaseVisa extends Visa<CaseDomainPermissions> {
	determineIf(
		func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
	): boolean;
}
