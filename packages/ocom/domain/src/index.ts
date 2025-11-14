import type * as Case from './domain/contexts/case.ts';
import type * as Community from './domain/contexts/community.ts';
import type * as Property from './domain/contexts/property.ts';
import type * as Service from './domain/contexts/service.ts';
import type * as User from './domain/contexts/user.ts';

export * as Domain from './domain/index.ts';

export interface DomainDataSource {
    Case: {
        ServiceTicket: {
            V1: {
                ServiceTicketV1UnitOfWork: Case.ServiceTicketV1UnitOfWork;
            };
        };
    };
	Community: {
		Community: {
			CommunityUnitOfWork: Community.CommunityUnitOfWork;
		};
        Member: {
            MemberUnitOfWork: Community.MemberUnitOfWork;
        };
		Role: {
			EndUserRole: {
				EndUserRoleUnitOfWork: Community.EndUserRoleUnitOfWork;
			};
			VendorUserRole: {
				VendorUserRoleUnitOfWork: Community.VendorUserRoleUnitOfWork;
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
			EndUserUnitOfWork: User.EndUserUnitOfWork;
		};
		StaffRole: {
			StaffRoleUnitOfWork: User.StaffRoleUnitOfWork;
		};
		StaffUser: {
			StaffUserUnitOfWork: User.StaffUserUnitOfWork;
		};
		VendorUser: {
			VendorUserUnitOfWork: User.VendorUserUnitOfWork;
		};
	};
	Service: {
		Service: {
			ServiceUnitOfWork: Service.ServiceUnitOfWork;
		};
	};
}
