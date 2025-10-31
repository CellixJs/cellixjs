import type { CasePassport } from '../../../../contexts/case/case.passport.ts';
import type { ServiceTicketV1EntityReference } from '../../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { ViolationTicketV1EntityReference } from '../../../../contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import { StaffUserPassportBase } from '../../staff-user.passport-base.ts';
import { StaffUserServiceTicketVisa } from './staff-user.service-ticket.visa.ts';
import { StaffUserViolationTicketVisa } from './staff-user.violation-ticket.visa.ts';

export class StaffUserCasePassport
	extends StaffUserPassportBase
	implements CasePassport
{
	forServiceTicketV1(_root: ServiceTicketV1EntityReference) {
		return new StaffUserServiceTicketVisa();
	}

	forViolationTicketV1(_root: ViolationTicketV1EntityReference) {
		return new StaffUserViolationTicketVisa();
	}
}