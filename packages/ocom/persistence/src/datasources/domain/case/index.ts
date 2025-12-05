import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { ServiceTicketV1Persistence, type ServiceTicketV1ReturnType } from './service-ticket-v1/index.ts';

interface CaseContextPersistence {
	ServiceTicket: {
		V1: ServiceTicketV1ReturnType;
	};
}

type CaseContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => CaseContextPersistence;

export const CaseContextPersistence: CaseContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ({
	ServiceTicket: {
		V1: ServiceTicketV1Persistence(models, passport),
	},
});