import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';
import { InProcEventBusInstance } from '@cellix/event-bus-seedwork-node/in-proc-event-bus';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { VendorUserRoleConverter } from './vendor-user-role.domain-adapter.ts';
import { VendorUserRoleRepository } from './vendor-user-role.repository.ts';

export const getVendorUserRoleUnitOfWork = (
    vendorUserRoleModel: Models.Role.VendorUserRoleModelType,
    passport: Passport
): Domain.Contexts.Community.Role.VendorUserRole.VendorUserRoleUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        vendorUserRoleModel,
        new VendorUserRoleConverter(),
        VendorUserRoleRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}