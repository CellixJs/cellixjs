import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { VendorUserRoleConverter } from './vendor-user-role.domain-adapter.ts';
import { VendorUserRoleRepository } from './vendor-user-role.repository.ts';
import type * as VendorUserRole from '@ocom/domain/contexts/vendor-user-role';
import type { Passport } from '@ocom/domain/contexts/passport';

export const getVendorUserRoleUnitOfWork = (
    vendorUserRoleModel: Models.Role.VendorUserRoleModelType,
    passport: Passport
): VendorUserRole.VendorUserRoleUnitOfWork => {
    const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(
        InProcEventBusInstance,
        NodeEventBusInstance,
        vendorUserRoleModel,
        new VendorUserRoleConverter(),
        VendorUserRoleRepository,
    );
    return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
}