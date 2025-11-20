/**
 * Main entry point for @ocom/domain package
 * 
 * DEPRECATED: This file maintains backwards compatibility but should not be used.
 * Use direct imports from subpaths instead:
 * - @ocom/domain/case
 * - @ocom/domain/community
 * - @ocom/domain/property
 * - @ocom/domain/service
 * - @ocom/domain/user
 * - @ocom/domain/events
 * - @ocom/domain/services
 * - @ocom/domain/passport
 * - @ocom/domain/value-objects
 */

import type {
	CommunityUnitOfWork,
	EndUserRoleUnitOfWork,
	MemberUnitOfWork,
	VendorUserRoleUnitOfWork,
} from './domain/contexts/community.ts';
import type {
	ServiceTicketV1UnitOfWork,
	ViolationTicketV1UnitOfWork,
} from './domain/contexts/case.ts';
import type { PropertyUnitOfWork } from './domain/contexts/property.ts';
import type { ServiceUnitOfWork } from './domain/contexts/service.ts';
import type {
	EndUserUnitOfWork,
	StaffRoleUnitOfWork,
	StaffUserUnitOfWork,
	VendorUserUnitOfWork,
} from './domain/contexts/user.ts';

// Re-export everything for backwards compatibility
// biome-ignore lint/performance/noBarrelFile: Backwards compatibility layer
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/contexts/case.ts';
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/contexts/community.ts';
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/contexts/property.ts';
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/contexts/service.ts';
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/contexts/user.ts';
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/events.ts';
// biome-ignore lint/performance/noReExportAll: Backwards compatibility layer
export * from './domain/services.ts';
export type { Passport } from './domain/contexts/passport.ts';
export { PassportFactory } from './domain/contexts/passport.ts';
export type { DomainExecutionContext } from './domain/domain-execution-context.ts';
export { Email, NullableEmail, ExternalId } from './domain/contexts/value-objects.ts';

export interface DomainDataSource {
	Case: {
		ServiceTicket: {
			V1: {
				ServiceTicketV1UnitOfWork: ServiceTicketV1UnitOfWork;
			};
		};
		ViolationTicket: {
			V1: {
				ViolationTicketV1UnitOfWork: ViolationTicketV1UnitOfWork;
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
