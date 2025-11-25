// Re-export all domain exports
export * from './domain.ts';

// DomainDataSource interface for persistence layer integration
export interface DomainDataSource {
	Case: {
		ServiceTicket: {
			V1: {
				ServiceTicketV1UnitOfWork: import('./domain.ts').ServiceTicketV1UnitOfWork;
			};
		};
	};
	Community: {
		Community: {
			CommunityUnitOfWork: import('./domain.ts').CommunityUnitOfWork;
		};
		Member: {
			MemberUnitOfWork: import('./domain.ts').MemberUnitOfWork;
		};
		Role: {
			EndUserRole: {
				EndUserRoleUnitOfWork: import('./domain.ts').EndUserRoleUnitOfWork;
			};
			VendorUserRole: {
				VendorUserRoleUnitOfWork: import('./domain.ts').VendorUserRoleUnitOfWork;
			};
		};
	};
	Property: {
		Property: {
			PropertyUnitOfWork: import('./domain.ts').PropertyUnitOfWork;
		};
	};
	User: {
		EndUser: {
			EndUserUnitOfWork: import('./domain.ts').EndUserUnitOfWork;
		};
		StaffRole: {
			StaffRoleUnitOfWork: import('./domain.ts').StaffRoleUnitOfWork;
		};
		StaffUser: {
			StaffUserUnitOfWork: import('./domain.ts').StaffUserUnitOfWork;
		};
		VendorUser: {
			VendorUserUnitOfWork: import('./domain.ts').VendorUserUnitOfWork;
		};
	};
	Service: {
		Service: {
			ServiceUnitOfWork: import('./domain.ts').ServiceUnitOfWork;
		};
	};
}
