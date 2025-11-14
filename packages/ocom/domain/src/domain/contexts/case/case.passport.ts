import type { CaseVisa } from './case.visa.ts';
import type { ServiceTicketV1EntityReference } from './service-ticket/v1/index.ts';
import type { ViolationTicketV1EntityReference } from './violation-ticket/v1/index.ts';

export interface CasePassport {
	forServiceTicketV1(root: ServiceTicketV1EntityReference): CaseVisa;
	forViolationTicketV1(root: ViolationTicketV1EntityReference): CaseVisa;
}
