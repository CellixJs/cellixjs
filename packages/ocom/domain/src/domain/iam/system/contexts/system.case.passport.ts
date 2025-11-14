import type { CaseDomainPermissions } from '../../../contexts/case/case.domain-permissions.ts';
import type { CasePassport } from '../../../contexts/case/case.passport.ts';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { ViolationTicketV1EntityReference } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import { SystemPassportBase } from '../system.passport-base.ts';

export class SystemCasePassport
	extends SystemPassportBase
	implements CasePassport
{
	forServiceTicketV1(_root: ServiceTicketV1EntityReference) {
		const permissions = this.permissions as CaseDomainPermissions;
		return {
			determineIf: (
				func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
			) => func(permissions),
		};
	}

	forViolationTicketV1(_root: ViolationTicketV1EntityReference) {
		const permissions = this.permissions as CaseDomainPermissions;
		return {
			determineIf: (
				func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
			) => func(permissions),
		};
	}
}
