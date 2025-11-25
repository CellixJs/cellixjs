import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Passport } from '@ocom/domain';
import { ServiceConverter } from './service.domain-adapter.ts';
import { ServiceRepository } from './service.repository.ts';
import type { ServiceModelType } from '@ocom/data-sources-mongoose-models/service';

export const getServiceUnitOfWork = (
    serviceModel: ServiceModelType,
    passport: Passport
): ServiceUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceModel,
        new ServiceConverter(),
        ServiceRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}