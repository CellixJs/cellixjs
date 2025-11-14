import type { CasePassport } from '../../../contexts/case/case.passport.ts';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { ViolationTicketV1EntityReference } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestCasePassport
	extends GuestPassportBase
	implements CasePassport
{
	forServiceTicketV1(_root: ServiceTicketV1EntityReference) {
		return { determineIf: () => false };
	}

	forViolationTicketV1(_root: ViolationTicketV1EntityReference) {
		return { determineIf: () => false };
	}
}
