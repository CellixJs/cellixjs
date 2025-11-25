import {
    InProcEventBusInstance,
    NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import type { DomainDataSource, Passport } from '@ocom/domain';
import { ServiceTicketV1Converter } from './service-ticket-v1.domain-adapter.ts';
import { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';
import type { ServiceTicketModelType } from '@ocom/data-sources-mongoose-models/case/service-ticket';

export const getServiceTicketV1UnitOfWork = (
    serviceTicketModel: ServiceTicketModelType,
    passport: Passport
): Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1UnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceTicketModel,
        new ServiceTicketV1Converter(),
        ServiceTicketV1Repository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}