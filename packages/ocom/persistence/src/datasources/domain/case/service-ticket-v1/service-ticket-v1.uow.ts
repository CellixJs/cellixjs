import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { ServiceTicketV1Converter } from './service-ticket-v1.domain-adapter.ts';
import { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';

export const getServiceTicketV1UnitOfWork = (
    serviceTicketModel: Models.Case.ServiceTicketModelType,
    passport: Passport
): ServiceTicketV1UnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceTicketModel,
        new ServiceTicketV1Converter(),
        ServiceTicketV1Repository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}