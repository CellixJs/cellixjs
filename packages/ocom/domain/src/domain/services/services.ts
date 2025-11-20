/**
 * Domain Services Aggregate Export File
 */

import { CommunityProvisioningService } from './community/community-provisioning.service.ts';

export const Community = {
	CommunityProvisioningService: new CommunityProvisioningService(),
};

//#region Exports
// All exports are above
//#endregion Exports
