import { MongooseSeedwork } from '@cellix/data-sources-mongoose';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/api-data-sources-mongoose-models';
import type { Domain } from '@ocom/api-domain';
import { EndUserRoleConverter } from './end-user-role.domain-adapter.ts';
import { EndUserRoleRepository } from './end-user-role.repository.ts';

export const getEndUserRoleUnitOfWork = (
    endUserRoleModel: Models.Role.EndUserRoleModelType,
    passport: Domain.Passport
): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserRoleModel,
        new EndUserRoleConverter(),
        EndUserRoleRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
