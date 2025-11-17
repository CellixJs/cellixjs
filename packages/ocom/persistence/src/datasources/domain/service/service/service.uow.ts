import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { ServiceConverter } from './service.domain-adapter.ts';
import { ServiceRepository } from './service.repository.ts';
import type * as Service from '@ocom/domain/contexts/service';
import type { Passport } from '@ocom/domain/contexts/passport';

export const getServiceUnitOfWork = (
    serviceModel: Models.Service.ServiceModelType,
    passport: Passport
): Service.ServiceUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceModel,
        new ServiceConverter(),
        ServiceRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}