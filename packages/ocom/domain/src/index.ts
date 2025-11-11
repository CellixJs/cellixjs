import type { CommunityUnitOfWork } from './domain/contexts/community/community/index.ts';
import type { MemberUnitOfWork } from './domain/contexts/community/member/index.ts';
import type { EndUserRoleUnitOfWork } from './domain/contexts/community/role/end-user-role/index.ts';
import type { VendorUserRoleUnitOfWork } from './domain/contexts/community/role/vendor-user-role/index.ts';
import type { ServiceTicketV1UnitOfWork } from './domain/contexts/case/service-ticket/v1/index.ts';
import type { PropertyUnitOfWork } from './domain/contexts/property/property/index.ts';
import type { EndUserUnitOfWork } from './domain/contexts/user/end-user/index.ts';
import type { StaffRoleUnitOfWork } from './domain/contexts/user/staff-role/index.ts';
import type { StaffUserUnitOfWork } from './domain/contexts/user/staff-user/index.ts';
import type { VendorUserUnitOfWork } from './domain/contexts/user/vendor-user/index.ts';
import type { ServiceUnitOfWork } from './domain/contexts/service/service/index.ts';

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
