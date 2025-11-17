import type { ModelsContext } from '../../../../index.ts';
import { getServiceTicketV1UnitOfWork } from './service-ticket-v1.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const ServiceTicketV1Persistence = (models: ModelsContext, passport: Passport) => {
	const ServiceTicketModel = models.Case.ServiceTicket;
	return {
		ServiceTicketV1UnitOfWork: getServiceTicketV1UnitOfWork(ServiceTicketModel, passport),
	};
};