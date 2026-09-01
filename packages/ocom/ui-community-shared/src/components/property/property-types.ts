/**
 * Route-neutral Property data contracts shared by the manager and member
 * Community Portal routes. These intentionally mirror GraphQL shapes without
 * depending on generated client types.
 */

export interface PropertyAddress {
	streetNumber?: string | null | undefined;
	streetName?: string | null | undefined;
	municipality?: string | null | undefined;
	countrySubdivision?: string | null | undefined;
	postalCode?: string | null | undefined;
	country?: string | null | undefined;
}

export interface PropertyLocation {
	address?: PropertyAddress | null | undefined;
}

export interface PropertyBedroomDetail {
	roomName?: string | null | undefined;
	bedDescriptions?: readonly (string | null | undefined)[] | null | undefined;
}

export interface PropertyAdditionalAmenity {
	category?: string | null | undefined;
	amenities?: readonly (string | null | undefined)[] | null | undefined;
}

export interface PropertyListingDetail {
	price?: number | null | undefined;
	rentHigh?: number | null | undefined;
	rentLow?: number | null | undefined;
	lease?: number | null | undefined;
	maxGuests?: number | null | undefined;
	bedrooms?: number | null | undefined;
	bathrooms?: number | null | undefined;
	squareFeet?: number | null | undefined;
	yearBuilt?: number | null | undefined;
	lotSize?: number | null | undefined;
	description?: string | null | undefined;
	amenities?: readonly (string | null | undefined)[] | null | undefined;
	bedroomDetails?: readonly PropertyBedroomDetail[] | null | undefined;
	additionalAmenities?: readonly PropertyAdditionalAmenity[] | null | undefined;
	images?: readonly (string | null | undefined)[] | null | undefined;
	video?: string | null | undefined;
	floorPlan?: string | null | undefined;
	floorPlanImages?: readonly (string | null | undefined)[] | null | undefined;
	listingAgent?: string | null | undefined;
	listingAgentPhone?: string | null | undefined;
	listingAgentEmail?: string | null | undefined;
	listingAgentWebsite?: string | null | undefined;
	listingAgentCompany?: string | null | undefined;
	listingAgentCompanyPhone?: string | null | undefined;
	listingAgentCompanyEmail?: string | null | undefined;
	listingAgentCompanyWebsite?: string | null | undefined;
	listingAgentCompanyAddress?: string | null | undefined;
}

export interface PropertyOwner {
	id: string;
	memberName?: string | null | undefined;
}

export interface PropertyRecord {
	id: string;
	propertyName: string;
	propertyType?: string | null | undefined;
	listedForSale?: boolean | null | undefined;
	listedForRent?: boolean | null | undefined;
	listedForLease?: boolean | null | undefined;
	listedInDirectory?: boolean | null | undefined;
	tags?: readonly (string | null | undefined)[] | null | undefined;
	owner?: PropertyOwner | null | undefined;
	location?: PropertyLocation | null | undefined;
	listingDetail?: PropertyListingDetail | null | undefined;
	createdAt?: string | Date | null | undefined;
	updatedAt?: string | Date | null | undefined;
}

/** Values of one bedroom-detail row; list values are edited as comma-separated text. */
export interface PropertyFormBedroomDetailValues {
	roomName?: string | null | undefined;
	bedDescriptions?: string | null | undefined;
}

/** Values of one additional-amenity row; list values are edited as comma-separated text. */
export interface PropertyFormAdditionalAmenityValues {
	category?: string | null | undefined;
	amenities?: string | null | undefined;
}

/**
 * Form-internal Property value shape. Keeping this independent from GraphQL
 * lets route adapters decide which fields their authorization policy permits.
 */
export interface PropertyFormValues {
	propertyName?: string | undefined;
	propertyType?: string | null | undefined;
	ownerId?: string | null | undefined;
	listedForSale?: boolean | undefined;
	listedForRent?: boolean | undefined;
	listedForLease?: boolean | undefined;
	listedInDirectory?: boolean | undefined;
	tags?: string | null | undefined;
	location?: {
		address?: PropertyAddress;
	};
	listingDetail?: {
		price?: number | null | undefined;
		rentHigh?: number | null | undefined;
		rentLow?: number | null | undefined;
		lease?: number | null | undefined;
		maxGuests?: number | null | undefined;
		bedrooms?: number | null | undefined;
		bathrooms?: number | null | undefined;
		squareFeet?: number | null | undefined;
		yearBuilt?: number | null | undefined;
		lotSize?: number | null | undefined;
		description?: string | null | undefined;
		amenities?: string | null | undefined;
		bedroomDetails?: PropertyFormBedroomDetailValues[] | undefined;
		additionalAmenities?: PropertyFormAdditionalAmenityValues[] | undefined;
		images?: string | null | undefined;
		video?: string | null | undefined;
		floorPlan?: string | null | undefined;
		floorPlanImages?: string | null | undefined;
		listingAgent?: string | null | undefined;
		listingAgentPhone?: string | null | undefined;
		listingAgentEmail?: string | null | undefined;
		listingAgentWebsite?: string | null | undefined;
		listingAgentCompany?: string | null | undefined;
		listingAgentCompanyPhone?: string | null | undefined;
		listingAgentCompanyEmail?: string | null | undefined;
		listingAgentCompanyWebsite?: string | null | undefined;
		listingAgentCompanyAddress?: string | null | undefined;
	};
}

/** Member option offered by a manager's Owner select. */
export interface PropertyFormMemberOption {
	id: string;
	memberName?: string | null | undefined;
}

export interface PropertyAddressInput {
	streetNumber: string | null;
	streetName: string | null;
	municipality: string | null;
	countrySubdivision: string | null;
	postalCode: string | null;
	country: string | null;
}

export interface PropertyLocationInput {
	address: PropertyAddressInput;
}

export interface PropertyBedroomDetailInput {
	roomName: string | null;
	bedDescriptions: string[];
}

interface PropertyAdditionalAmenityInput {
	category: string | null;
	amenities: string[];
}

export interface PropertyListingDetailInput {
	price: number | null;
	rentHigh: number | null;
	rentLow: number | null;
	lease: number | null;
	maxGuests: number | null;
	bedrooms: number | null;
	bathrooms: number | null;
	squareFeet: number | null;
	yearBuilt: number | null;
	lotSize: number | null;
	description: string | null;
	amenities: string[];
	bedroomDetails: PropertyBedroomDetailInput[];
	additionalAmenities: PropertyAdditionalAmenityInput[];
	images: string[];
	video: string | null;
	floorPlan: string | null;
	floorPlanImages: string[];
	listingAgent: string | null;
	listingAgentPhone: string | null;
	listingAgentEmail: string | null;
	listingAgentWebsite: string | null;
	listingAgentCompany: string | null;
	listingAgentCompanyPhone: string | null;
	listingAgentCompanyEmail: string | null;
	listingAgentCompanyWebsite: string | null;
	listingAgentCompanyAddress: string | null;
}

/** Listing fields a member is allowed to create or update. */
export interface PropertyListingContentInput {
	listedForSale: boolean;
	listedForRent: boolean;
	listedForLease: boolean;
	listedInDirectory: boolean;
	tags: string[];
	location: PropertyLocationInput;
	listingDetail: PropertyListingDetailInput;
}

/** Full manager-only form fields in addition to listing content. */
export interface ManagerPropertyInputFields extends PropertyListingContentInput {
	propertyType: string | null;
	ownerId: string | null;
}

/** Positive member-create allowlist. No owner or property type can appear here. */
export interface MemberPropertyCreateInput extends PropertyListingContentInput {
	propertyName: string;
}

/** Positive member-update allowlist. No name, owner, or property type can appear here. */
export interface MemberPropertyUpdateInput extends PropertyListingContentInput {
	id: string;
}
