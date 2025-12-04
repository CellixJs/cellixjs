import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getServiceTicketV1UnitOfWork } from './service-ticket-v1.uow.ts';

export type ServiceTicketV1ReturnType = {
	ServiceTicketV1UnitOfWork: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1UnitOfWork;
};

type ServiceTicketV1PersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ServiceTicketV1ReturnType;

export const ServiceTicketV1Persistence: ServiceTicketV1PersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const ServiceTicketModel = models.ServiceTicket;
	return {
		ServiceTicketV1UnitOfWork: getServiceTicketV1UnitOfWork(ServiceTicketModel, passport),
	};
};