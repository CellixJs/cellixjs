import type { CaseVisa } from './case.visa.ts';
import type { ServiceTicketV1EntityReference } from './service-ticket/v1/service-ticket-v1.aggregate.ts';

export interface CasePassport {
	forServiceTicketV1(root: ServiceTicketV1EntityReference): CaseVisa;
}