import type { Contexts } from './domain/index.ts';

export * as Domain from './domain/index.ts';

export interface DomainDataSource {
    Case: {
        ServiceTicket: {
            V1: {
                ServiceTicketV1UnitOfWork: Contexts.Case.ServiceTicket.V1.ServiceTicketV1UnitOfWork;
            };
        };
    };
	Community: {
		Community: {
			CommunityUnitOfWork: Contexts.Community.Community.CommunityUnitOfWork;
		};
        Member: {
            MemberUnitOfWork: Contexts.Community.Member.MemberUnitOfWork;
        };
		Role: {
			EndUserRole: {
				EndUserRoleUnitOfWork: Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork;
			};
			VendorUserRole: {
				VendorUserRoleUnitOfWork: Contexts.Community.Role.VendorUserRole.VendorUserRoleUnitOfWork;
			};
		};
	};
	Property: {
		Property: {
			PropertyUnitOfWork: Contexts.Property.Property.PropertyUnitOfWork;
		};
	};
	User: {
		EndUser: {
			EndUserUnitOfWork: Contexts.User.EndUser.EndUserUnitOfWork;
		};
		StaffRole: {
			StaffRoleUnitOfWork: Contexts.User.StaffRole.StaffRoleUnitOfWork;
		};
		StaffUser: {
			StaffUserUnitOfWork: Contexts.User.StaffUser.StaffUserUnitOfWork;
		};
		VendorUser: {
			VendorUserUnitOfWork: Contexts.User.VendorUser.VendorUserUnitOfWork;
		};
	};
	Service: {
		Service: {
			ServiceUnitOfWork: Contexts.Service.Service.ServiceUnitOfWork;
		};
	};
}
