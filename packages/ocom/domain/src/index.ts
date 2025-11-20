/**
 * @ocom/domain - Main exports
 * 
 * This is the main entry point for the domain package.
 * All exports are direct from aggregate files, not from barrel files.
 */

// Domain contexts - aggregate exports
export * as Case from './domain/contexts/case.ts';
export * as Community from './domain/contexts/community.ts';
export * as Property from './domain/contexts/property.ts';
export * as Service from './domain/contexts/service.ts';
export * as User from './domain/contexts/user.ts';

// Passport factory and types
export { type Passport, PassportFactory } from './domain/contexts/passport.ts';

// Domain execution context
export type { DomainExecutionContext } from './domain/domain-execution-context.ts';

// Domain events
export * as Events from './domain/events/index.ts';

// Domain services
export * as Services from './domain/services/index.ts';

// IAM (Identity and Access Management)
export * as IAM from './domain/iam/index.ts';

// Domain data source interface for unit of work types
export interface DomainDataSource {
	Case: {
		ServiceTicket: {
			V1: {
				ServiceTicketV1UnitOfWork: import('./domain/contexts/case.ts').ServiceTicketV1UnitOfWork;
			};
		};
	};
	Community: {
		Community: {
			CommunityUnitOfWork: import('./domain/contexts/community.ts').CommunityUnitOfWork;
		};
		Member: {
			MemberUnitOfWork: import('./domain/contexts/community.ts').MemberUnitOfWork;
		};
		Role: {
			EndUserRole: {
				EndUserRoleUnitOfWork: import('./domain/contexts/community.ts').EndUserRoleUnitOfWork;
			};
			VendorUserRole: {
				VendorUserRoleUnitOfWork: import('./domain/contexts/community.ts').VendorUserRoleUnitOfWork;
			};
		};
	};
	Property: {
		Property: {
			PropertyUnitOfWork: import('./domain/contexts/property.ts').PropertyUnitOfWork;
		};
	};
	User: {
		EndUser: {
			EndUserUnitOfWork: import('./domain/contexts/user.ts').EndUserUnitOfWork;
		};
		StaffRole: {
			StaffRoleUnitOfWork: import('./domain/contexts/user.ts').StaffRoleUnitOfWork;
		};
		StaffUser: {
			StaffUserUnitOfWork: import('./domain/contexts/user.ts').StaffUserUnitOfWork;
		};
		VendorUser: {
			VendorUserUnitOfWork: import('./domain/contexts/user.ts').VendorUserUnitOfWork;
		};
	};
	Service: {
		Service: {
			ServiceUnitOfWork: import('./domain/contexts/service.ts').ServiceUnitOfWork;
		};
	};
}
