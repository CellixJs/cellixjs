/**
 * Property Aggregate Export File
 */
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
	Property,
	type PropertyEntityReference,
	type PropertyProps,
} from './property/property.aggregate.ts';
export type { PropertyRepository } from './property/property.repository.ts';
export type { PropertyUnitOfWork } from './property/property.uow.ts';
export type { PropertyListingDetailProps } from './property/property-listing-detail.entity.ts';
export type { PropertyListingDetailAdditionalAmenityProps } from './property/property-listing-detail-additional-amenity.entity.ts';
export type { PropertyListingDetailBedroomDetailProps } from './property/property-listing-detail-bedroom-detail.entity.ts';
export type { PropertyLocationProps } from './property/property-location.entity.ts';
export type { PropertyLocationAddressProps } from './property/property-location-address.entity.ts';
export type { PropertyLocationPositionProps } from './property/property-location-position.entity.ts';

//#region Exports
// All exports are above
//#endregion Exports
