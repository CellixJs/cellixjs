import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { ServiceTicketV1Persistence, type ServiceTicketV1ReturnType } from './service-ticket-v1/index.ts';

type CaseContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	ServiceTicket: {
		V1: ServiceTicketV1ReturnType;
	};
};

export const CaseContextPersistence: CaseContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ({
	ServiceTicket: {
		V1: ServiceTicketV1Persistence(models, passport),
	},
});