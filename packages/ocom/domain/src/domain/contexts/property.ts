/**
 * Property Context - Aggregate Exports
 * 
 * This file serves as the single entry point for all exports from the Property bounded context.
 * It consolidates exports from Property aggregate root, repositories, unit of work, and related types.
 */

//#region Exports

// Property aggregate, types, and contracts
export {
	Property,
	type PropertyEntityReference,
	type PropertyProps,
} from './property/property/property.aggregate.ts';
export type { PropertyRepository } from './property/property/property.repository.ts';
export type { PropertyUnitOfWork } from './property/property/property.uow.ts';

// Property entities and value object types
export type { PropertyListingDetailProps } from './property/property/property-listing-detail.entity.ts';
export type { PropertyListingDetailAdditionalAmenityProps } from './property/property/property-listing-detail-additional-amenity.entity.ts';
export type { PropertyListingDetailBedroomDetailProps } from './property/property/property-listing-detail-bedroom-detail.entity.ts';
export type { PropertyLocationProps } from './property/property/property-location.entity.ts';
export type { PropertyLocationAddressProps } from './property/property/property-location-address.entity.ts';
export type { PropertyLocationPositionProps } from './property/property/property-location-position.entity.ts';

// Property context passport
export type { PropertyPassport } from './property/property.passport.ts';

//#endregion Exports
