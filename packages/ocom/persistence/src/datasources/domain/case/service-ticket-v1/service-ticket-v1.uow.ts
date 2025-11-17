import {
    InProcEventBusInstance,
    NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { ServiceTicketV1Converter } from './service-ticket-v1.domain-adapter.ts';
import { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';
import type * as ServiceTicketV1 from '@ocom/domain/contexts/service-ticket/v1';
import type { Passport } from '@ocom/domain/contexts/passport';

export const getServiceTicketV1UnitOfWork = (
    serviceTicketModel: Models.Case.ServiceTicketModelType,
    passport: Passport
): ServiceTicketV1.ServiceTicketV1UnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceTicketModel,
        new ServiceTicketV1Converter(),
        ServiceTicketV1Repository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}