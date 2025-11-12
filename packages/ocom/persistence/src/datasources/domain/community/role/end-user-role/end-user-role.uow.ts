import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
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
