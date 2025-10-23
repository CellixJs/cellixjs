import type { CasePassport } from '../../../contexts/case/case.passport.ts';
import type { ServiceTicketV1Visa } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.visa.ts';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberServiceTicketVisa } from './member.service-ticket.visa.ts';

export class MemberCasePassport
	extends MemberPassportBase
	implements CasePassport
{
	forServiceTicketV1(root: ServiceTicketV1EntityReference): ServiceTicketV1Visa {
		return new MemberServiceTicketVisa(root, this._member);
	}
}