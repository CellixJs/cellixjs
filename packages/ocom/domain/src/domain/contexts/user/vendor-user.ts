/**
 * Vendor User Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export type { VendorUserRepository } from './vendor-user/vendor-user.repository.ts';
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	VendorUser,
	type VendorUserEntityReference,
	type VendorUserProps,
} from './vendor-user/vendor-user.ts';
export type { VendorUserUnitOfWork } from './vendor-user/vendor-user.uow.ts';
export type {
	VendorUserContactInformationEntityReference,
	VendorUserContactInformationProps,
} from './vendor-user/vendor-user-contact-information.ts';
export type {
	VendorUserIdentityDetailsEntityReference,
	VendorUserIdentityDetailsProps,
} from './vendor-user/vendor-user-identity-details.ts';
export type {
	VendorUserPersonalInformationEntityReference,
	VendorUserPersonalInformationProps,
} from './vendor-user/vendor-user-personal-information.ts';

//#region Exports
// All exports are above
//#endregion Exports
