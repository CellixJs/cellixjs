import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CommunityModelFactory } from './models/community/community.model.ts';
import { MemberModelFactory } from './models/member/member.model.ts';
import { EndUserModelFactory } from './models/user/end-user.model.ts';
import { StaffUserModelFactory } from './models/user/staff-user.model.ts';
import { VendorUserModelFactory } from './models/user/vendor-user.model.ts';
import { UserModelFactory } from './models/user/user.model.ts';
import { EndUserRoleModelFactory } from './models/role/end-user-role.model.ts';
import { RoleModelFactory } from './models/role/role.model.ts';
import { StaffRoleModelFactory } from './models/role/staff-role.model.ts';
import { VendorUserRoleModelFactory } from './models/role/vendor-user-role.model.ts';
import { ServiceTicketModelFactory } from './models/case/service-ticket.model.ts';
import { TicketModelFactory } from './models/case/ticket.model.ts';
import { PropertyModelFactory } from './models/property/property.model.ts';
import { ServiceModelFactory } from './models/service/service.model.ts';

export const mongooseContextBuilder = (
initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
const roleModel = RoleModelFactory(initializedService);
const userModel = UserModelFactory(initializedService);
    const ticketModel = TicketModelFactory(initializedService);
return {
        Case: {
ServiceTicket: ServiceTicketModelFactory(ticketModel),
},
Community: {
Community: CommunityModelFactory(initializedService),
},
        Member: {
           Member: MemberModelFactory(initializedService),
        },
        Property: {
Property: PropertyModelFactory(initializedService),
},
        Role: {
            EndUserRole: EndUserRoleModelFactory(roleModel),
StaffRole: StaffRoleModelFactory(roleModel),
VendorUserRole: VendorUserRoleModelFactory(roleModel),
        },
        Service: {
Service: ServiceModelFactory(initializedService),
},
User: {
EndUser: EndUserModelFactory(userModel),
StaffUser: StaffUserModelFactory(userModel),
VendorUser: VendorUserModelFactory(userModel),
},
};
};
