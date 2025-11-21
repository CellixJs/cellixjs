import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getServiceTicketV1UnitOfWork } from './service-ticket-v1.uow.ts';

export const ServiceTicketV1Persistence = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	const ServiceTicketModel = models.Case.ServiceTicket;
	return {
		ServiceTicketV1UnitOfWork: getServiceTicketV1UnitOfWork(
			ServiceTicketModel,
			passport,
		),
	};
};
