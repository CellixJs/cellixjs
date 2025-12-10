import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { ServiceTicketV1Persistence, type ServiceTicketV1ReturnType } from './service-ticket-v1/index.ts';

export interface CaseContextPersistence {
	ServiceTicket: {
		V1: ServiceTicketV1ReturnType;
	};
}

export const CaseContextPersistence: PersistenceFactory<CaseContextPersistence> = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ({
	ServiceTicket: {
		V1: ServiceTicketV1Persistence(models, passport),
	},
});