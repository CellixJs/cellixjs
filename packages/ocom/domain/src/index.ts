/**
 * @ocom/domain - Main exports
 * 
 * This is the main entry point for the domain package.
 * All exports are direct from aggregate files, not from barrel files.
 */

// Domain contexts - aggregate exports
import * as CaseContext from './domain/contexts/case.ts';
import * as CommunityContext from './domain/contexts/community.ts';
import * as PropertyContext from './domain/contexts/property.ts';
import * as ServiceContext from './domain/contexts/service.ts';
import * as UserContext from './domain/contexts/user.ts';

// Re-export contexts with their names
export { CaseContext as Case };
export { CommunityContext as Community };
export { PropertyContext as Property };
export { ServiceContext as Service };
export { UserContext as User };

// Passport factory and types
import { PassportFactory as PassportFactoryExport } from './domain/contexts/passport.ts';
export { type Passport } from './domain/contexts/passport.ts';
export { PassportFactoryExport as PassportFactory };

// Domain execution context
export type { DomainExecutionContext } from './domain/domain-execution-context.ts';

// Domain events
import * as DomainEvents from './domain/events/index.ts';
export { DomainEvents as Events };

// Domain services
import * as DomainServices from './domain/services/index.ts';
export { DomainServices as Services };

// IAM (Identity and Access Management)
import * as DomainIAM from './domain/iam/index.ts';
export { DomainIAM as IAM };

/**
 * @deprecated Use direct imports from aggregate files instead.
 * 
 * IMPORTANT: The Domain namespace pattern is deprecated and will be removed in a future version.
 * All downstream packages should migrate to direct imports.
 * 
 * Migration examples:
 * - Old: import type { Domain } from '@ocom/domain'; Domain.Contexts.Community.Community.CommunityEntityReference
 * - New: import type { CommunityEntityReference } from '@ocom/domain/community'
 * 
 * - Old: import { Domain } from '@ocom/domain'; Domain.PassportFactory.forMember(...)
 * - New: import { PassportFactory } from '@ocom/domain'; PassportFactory.forMember(...)
 * 
 * - Old: import { Domain } from '@ocom/domain'; Domain.Events.CommunityCreatedEvent
 * - New: import { CommunityCreatedEvent } from '@ocom/domain/events'
 * 
 * Note: Due to TypeScript configuration constraints, the Domain export is provided as an object,
 * not a namespace. This means type references must use `typeof Domain.Contexts.Case` patterns.
 * For this reason, migration to direct imports is strongly recommended.
 */
export const Domain = {
	Contexts: {
		Case: CaseContext,
		Community: CommunityContext,
		Property: PropertyContext,
		Service: ServiceContext,
		User: UserContext,
	},
	PassportFactory: PassportFactoryExport,
	Events: DomainEvents,
	Services: DomainServices,
	IAM: DomainIAM,
};

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
