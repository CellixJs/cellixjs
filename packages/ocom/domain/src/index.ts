import type * as Community from './domain/contexts/community/community/community.ts';
import type * as Member from './domain/contexts/community/member/member.ts';
import type * as EndUserRole from './domain/contexts/community/role/end-user-role/end-user-role.ts';
import type * as VendorUserRole from './domain/contexts/community/role/vendor-user-role/vendor-user-role.ts';
import type * as Property from './domain/contexts/property/property/property.aggregate.ts';
import type * as Service from './domain/contexts/service/service/service.aggregate.ts';
import type * as ServiceTicketV1 from './domain/contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type * as EndUser from './domain/contexts/user/end-user/end-user.ts';
import type * as StaffRole from './domain/contexts/user/staff-role/staff-role.ts';
import type * as StaffUser from './domain/contexts/user/staff-user/staff-user.ts';
import type * as VendorUser from './domain/contexts/user/vendor-user/vendor-user.ts';

// Export only the DomainDataSource interface for infrastructure configuration
export interface DomainDataSource {
    Case: {
        ServiceTicket: {
            V1: {
                ServiceTicketV1UnitOfWork: ServiceTicketV1.ServiceTicketV1UnitOfWork;
            };
        };
    };
	Community: {
		Community: {
			CommunityUnitOfWork: Community.CommunityUnitOfWork;
		};
        Member: {
            MemberUnitOfWork: Member.MemberUnitOfWork;
        };
		Role: {
			EndUserRole: {
				EndUserRoleUnitOfWork: EndUserRole.EndUserRoleUnitOfWork;
			};
			VendorUserRole: {
				VendorUserRoleUnitOfWork: VendorUserRole.VendorUserRoleUnitOfWork;
			};
		};
	};
	Property: {
		Property: {
			PropertyUnitOfWork: Property.PropertyUnitOfWork;
		};
	};
	User: {
		EndUser: {
			EndUserUnitOfWork: EndUser.EndUserUnitOfWork;
		};
		StaffRole: {
			StaffRoleUnitOfWork: StaffRole.StaffRoleUnitOfWork;
		};
		StaffUser: {
			StaffUserUnitOfWork: StaffUser.StaffUserUnitOfWork;
		};
		VendorUser: {
			VendorUserUnitOfWork: VendorUser.VendorUserUnitOfWork;
		};
	};
	Service: {
		Service: {
			ServiceUnitOfWork: Service.ServiceUnitOfWork;
		};
	};
}
