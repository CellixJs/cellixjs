import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { ServiceTicketV1Persistence, type ServiceTicketV1ReturnType } from './service-ticket-v1/index.ts';

interface CaseContextPersistence {
	ServiceTicket: {
		V1: ServiceTicketV1ReturnType;
	};
}

type CaseContextPersistenceType = PersistenceFactory<CaseContextPersistence>;

export const CaseContextPersistence: CaseContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ({
	ServiceTicket: {
		V1: ServiceTicketV1Persistence(models, passport),
	},
});