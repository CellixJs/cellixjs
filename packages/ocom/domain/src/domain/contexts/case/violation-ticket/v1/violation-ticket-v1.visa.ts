import type { CaseDomainPermissions } from '../../case.domain-permissions.ts';

/**
 * Visa interface for violation ticket operations
 */
export interface ViolationTicketV1Visa {
  determineIf(
    func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
  ): boolean;
}