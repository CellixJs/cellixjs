/**
 * Property Context - Aggregate Exports
 * 
 * This file serves as the single entry point for all Property context exports.
 * It consolidates exports from entities, value objects, repositories, and unit of work types.
 */

//#region Exports

// Property Aggregate
export {
	Property,
	type PropertyEntityReference,
	type PropertyProps,
} from './property/property/property.aggregate.ts';

// Repository & Unit of Work
export type { PropertyRepository } from './property/property/property.repository.ts';
export type { PropertyUnitOfWork } from './property/property/property.uow.ts';

// Property Entities
export type { PropertyListingDetailProps } from './property/property/property-listing-detail.entity.ts';
export type { PropertyListingDetailAdditionalAmenityProps } from './property/property/property-listing-detail-additional-amenity.entity.ts';
export type { PropertyListingDetailBedroomDetailProps } from './property/property/property-listing-detail-bedroom-detail.entity.ts';
export type { PropertyLocationProps } from './property/property/property-location.entity.ts';
export type { PropertyLocationAddressProps } from './property/property/property-location-address.entity.ts';
export type { PropertyLocationPositionProps } from './property/property/property-location-position.entity.ts';

// Passport & Visa
export type { PropertyPassport } from './property/property.passport.ts';
export type { PropertyVisa } from './property/property.visa.ts';

// Domain Permissions
export type { PropertyDomainPermissions } from './property/property.domain-permissions.ts';

//#endregion
