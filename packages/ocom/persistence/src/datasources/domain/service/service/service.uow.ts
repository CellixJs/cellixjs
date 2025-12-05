import type { UnitOfWorkFactory } from '@cellix/domain-seedwork/unit-of-work';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { ServiceConverter } from './service.domain-adapter.ts';
import { ServiceRepository } from './service.repository.ts';
import type { ServiceModelType } from '@ocom/data-sources-mongoose-models/service';

type ServiceUnitOfWorkType = UnitOfWorkFactory<
	ServiceModelType,
	Domain.Passport,
	Domain.Contexts.Service.Service.ServiceUnitOfWork
>;

export const getServiceUnitOfWork: ServiceUnitOfWorkType = (
    serviceModel: ServiceModelType,
    passport: Domain.Passport
) => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        serviceModel,
        new ServiceConverter(),
        ServiceRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}