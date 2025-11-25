import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { ServiceTicketModelType } from '@ocom/data-sources-mongoose-models/service';
import type { Domain } from '@ocom/domain';
import { ServiceTicketV1Converter } from './service-ticket-v1.domain-adapter.ts';
import { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';

export const getServiceTicketV1UnitOfWork = (
	serviceTicketModel: ServiceTicketModelType,
	passport: Domain.Passport,
): Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1UnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
		InProcEventBusInstance,
		NodeEventBusInstance,
		serviceTicketModel,
		new ServiceTicketV1Converter(),
		ServiceTicketV1Repository,
	);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
