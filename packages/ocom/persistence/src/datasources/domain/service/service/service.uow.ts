import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { ServiceConverter } from './service.domain-adapter.ts';
import { ServiceRepository } from './service.repository.ts';

export const getServiceUnitOfWork = (
    serviceModel: Models.Service.ServiceModelType,
    passport: Passport
): Domain.Contexts.Service.Service.ServiceUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceModel,
        new ServiceConverter(),
        ServiceRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}