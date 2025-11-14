import {
    InProcEventBusInstance,
    NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { ServiceTicketV1Converter } from './service-ticket-v1.domain-adapter.ts';
import { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';

export const getServiceTicketV1UnitOfWork = (
    serviceTicketModel: Models.Case.ServiceTicketModelType,
    passport: Domain.Passport
): Domain.ServiceTicketV1.ServiceTicketV1UnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceTicketModel,
        new ServiceTicketV1Converter(),
        ServiceTicketV1Repository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}