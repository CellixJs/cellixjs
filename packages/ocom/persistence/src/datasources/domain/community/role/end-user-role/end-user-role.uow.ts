import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { EndUserRoleConverter } from './end-user-role.domain-adapter.ts';
import { EndUserRoleRepository } from './end-user-role.repository.ts';

export const getEndUserRoleUnitOfWork = (
    endUserRoleModel: Models.Role.EndUserRoleModelType,
    passport: Domain.Passport
): Domain.EndUserRole.EndUserRoleUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserRoleModel,
        new EndUserRoleConverter(),
        EndUserRoleRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
