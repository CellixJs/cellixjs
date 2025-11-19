import type { CaseDomainPermissions } from '../../case.domain-permissions.ts';

/**
 * Visa interface for service ticket operations
 */
export interface ServiceTicketV1Visa {
	determineIf(
		func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
	): boolean;
}
