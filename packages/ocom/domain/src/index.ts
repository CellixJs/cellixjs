import type { CommunityUnitOfWork } from './domain/contexts/community/community/community.ts';
import type { MemberUnitOfWork } from './domain/contexts/community/member/member.ts';
import type { EndUserRoleUnitOfWork } from './domain/contexts/community/role/end-user-role/end-user-role.ts';
import type { VendorUserRoleUnitOfWork } from './domain/contexts/community/role/vendor-user-role/vendor-user-role.ts';
import type { ServiceTicketV1UnitOfWork } from './domain/contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { PropertyUnitOfWork } from './domain/contexts/property/property/property.aggregate.ts';
import type { EndUserUnitOfWork } from './domain/contexts/user/end-user/end-user.ts';
import type { StaffRoleUnitOfWork } from './domain/contexts/user/staff-role/staff-role.ts';
import type { StaffUserUnitOfWork } from './domain/contexts/user/staff-user/staff-user.ts';
import type { VendorUserUnitOfWork } from './domain/contexts/user/vendor-user/vendor-user.ts';
import type { ServiceUnitOfWork } from './domain/contexts/service/service/service.aggregate.ts';

export { type Passport, PassportFactory } from './domain/contexts/passport.ts';
export type { DomainExecutionContext } from './domain/domain-execution-context.ts';

export interface DomainDataSource {
	Case: {
		ServiceTicket: {
			V1: {
				ServiceTicketV1UnitOfWork: ServiceTicketV1UnitOfWork;
			};
		};
	};
	Community: {
		Community: {
			CommunityUnitOfWork: CommunityUnitOfWork;
		};
		Member: {
			MemberUnitOfWork: MemberUnitOfWork;
		};
		Role: {
			EndUserRole: {
				EndUserRoleUnitOfWork: EndUserRoleUnitOfWork;
			};
			VendorUserRole: {
				VendorUserRoleUnitOfWork: VendorUserRoleUnitOfWork;
			};
		};
	};
	Property: {
		Property: {
			PropertyUnitOfWork: PropertyUnitOfWork;
		};
	};
	User: {
		EndUser: {
			EndUserUnitOfWork: EndUserUnitOfWork;
		};
		StaffRole: {
			StaffRoleUnitOfWork: StaffRoleUnitOfWork;
		};
		StaffUser: {
			StaffUserUnitOfWork: StaffUserUnitOfWork;
		};
		VendorUser: {
			VendorUserUnitOfWork: VendorUserUnitOfWork;
		};
	};
	Service: {
		Service: {
			ServiceUnitOfWork: ServiceUnitOfWork;
		};
	};
}
