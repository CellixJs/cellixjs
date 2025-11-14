/**
 * Property Domain Context Aggregate
 * 
 * This file consolidates all exports from the Property bounded context.
 * 
 * All entities, repositories, unit of work types, and value objects
 * are exported from this single entry point.
 */

//#region Passport and Domain Permissions
export type { PropertyPassport } from './property/property.passport.ts';
//#endregion

//#region Property
export type { PropertyRepository } from './property/property/property.repository.ts';
export { Property, type PropertyEntityReference, type PropertyProps } from './property/property/property.aggregate.ts';
export type { PropertyListingDetailProps } from './property/property/property-listing-detail.entity.ts';
export type { PropertyListingDetailAdditionalAmenityProps } from './property/property/property-listing-detail-additional-amenity.entity.ts';
export type { PropertyListingDetailBedroomDetailProps } from './property/property/property-listing-detail-bedroom-detail.entity.ts';
export type { PropertyLocationProps } from './property/property/property-location.entity.ts';
export type { PropertyLocationAddressProps } from './property/property/property-location-address.entity.ts';
export type { PropertyLocationPositionProps } from './property/property/property-location-position.entity.ts';
export type { PropertyUnitOfWork } from './property/property/property.uow.ts';
//#endregion
