/**
 * Services - Aggregate Exports
 * 
 * This file serves as the single entry point for all domain services.
 */

import { CommunityProvisioningService as CommunityProvisioningServiceClass } from './services/community/community-provisioning.service.ts';

//#region Exports

// Community Services (singleton instances)
export const CommunityProvisioningService = new CommunityProvisioningServiceClass();

//#endregion
