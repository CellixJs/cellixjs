import type { UnitOfWorkFactory } from '@cellix/domain-seedwork/unit-of-work';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';

import type { Domain } from '@ocom/domain';
import { EndUserRoleConverter } from './end-user-role.domain-adapter.ts';
import { EndUserRoleRepository } from './end-user-role.repository.ts';
import type { EndUserRoleModelType } from '@ocom/data-sources-mongoose-models/role/end-user-role';

type EndUserRoleUnitOfWorkType = UnitOfWorkFactory<
	EndUserRoleModelType,
	Domain.Passport,
	Domain.Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork
>;

export const getEndUserRoleUnitOfWork: EndUserRoleUnitOfWorkType = (
    endUserRoleModel: EndUserRoleModelType,
    passport: Domain.Passport
) => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        endUserRoleModel,
        new EndUserRoleConverter(),
        EndUserRoleRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}
