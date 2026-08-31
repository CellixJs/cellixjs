/**
 * Full-field property GraphQL documents for the property field-management
 * scenarios (Task: expose all user-managed property business fields).
 *
 * These documents intentionally reference schema fields that the backend does
 * not implement yet (location/address, extended listing detail, ownerId, and
 * full create/update inputs). They are used ONLY by the new field-management
 * tasks and questions so that the pre-existing property scenarios, which use
 * `property-operations.ts`, keep passing while the new scenarios fail with
 * GraphQL validation errors until the backend lands.
 */

/** Canonical address fields exposed on `Property.location.address`. */
interface PropertyAddressResult {
	streetNumber: string | null;
	streetName: string | null;
	municipality: string | null;
	countrySubdivision: string | null;
	postalCode: string | null;
	country: string | null;
}

/** A single bedroom detail row of a property listing. */
interface PropertyBedroomDetailResult {
	id: string;
	roomName: string | null;
	bedDescriptions: string[] | null;
}

/** A single additional amenity category row of a property listing. */
interface PropertyAdditionalAmenityResult {
	id: string;
	category: string | null;
	amenities: string[] | null;
}

/** Full listing detail shape returned on the Property type. */
interface PropertyFullListingDetailResult {
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
	amenities: string[] | null;
	bedroomDetails: PropertyBedroomDetailResult[] | null;
	additionalAmenities: PropertyAdditionalAmenityResult[] | null;
	images: string[] | null;
	video: string | null;
	floorPlan: string | null;
	floorPlanImages: string[] | null;
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

/** Property shape returned by the full-field property queries and mutations. */
export interface PropertyFullResult {
	id: string;
	propertyName: string;
	propertyType: string | null;
	listedForSale: boolean;
	listedForRent: boolean;
	listedForLease: boolean;
	listedInDirectory: boolean;
	tags: string[] | null;
	community: { id: string };
	owner: { id: string; memberName: string | null } | null;
	location: { address: PropertyAddressResult | null } | null;
	listingDetail: PropertyFullListingDetailResult | null;
}

/** Status block returned by property mutations. */
interface PropertyMutationStatus {
	success: boolean;
	errorMessage?: string | null;
}

/** Result block returned by the full-field property mutations. */
export interface PropertyFullMutationResult {
	status: PropertyMutationStatus;
	property: PropertyFullResult | null;
}

/** Canonical address fields accepted by `PropertyAddressInput`. */
interface PropertyAddressInput {
	streetNumber?: string | undefined;
	streetName?: string | undefined;
	municipality?: string | undefined;
	countrySubdivision?: string | undefined;
	postalCode?: string | undefined;
	country?: string | undefined;
}

/** Bedroom detail row accepted by `PropertyBedroomDetailInput` (no id; rows are replaced wholesale). */
interface PropertyBedroomDetailInput {
	roomName?: string | undefined;
	bedDescriptions?: string[] | undefined;
}

/** Additional amenity row accepted by `PropertyAdditionalAmenityInput` (no id; rows are replaced wholesale). */
interface PropertyAdditionalAmenityInput {
	category?: string | undefined;
	amenities?: string[] | undefined;
}

/** Full listing detail fields accepted by `PropertyListingDetailInput`; null clears a value. */
export interface PropertyFullListingDetailInput {
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
	amenities?: string[] | undefined;
	bedroomDetails?: PropertyBedroomDetailInput[] | undefined;
	additionalAmenities?: PropertyAdditionalAmenityInput[] | undefined;
	images?: string[] | undefined;
	video?: string | null | undefined;
	floorPlan?: string | null | undefined;
	floorPlanImages?: string[] | undefined;
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

/** Location wrapper accepted by `PropertyLocationInput`. */
interface PropertyLocationInput {
	address?: PropertyAddressInput | undefined;
}

/** Fields shared by the full-field create and update inputs. */
export interface PropertyFullSharedInput {
	propertyType?: string | null | undefined;
	ownerId?: string | null | undefined;
	listedForSale?: boolean | undefined;
	listedForRent?: boolean | undefined;
	listedForLease?: boolean | undefined;
	listedInDirectory?: boolean | undefined;
	tags?: string[] | undefined;
	location?: PropertyLocationInput | undefined;
	listingDetail?: PropertyFullListingDetailInput | undefined;
}

/** Full-field `PropertyCreateInput`. */
export interface PropertyFullCreateInput extends PropertyFullSharedInput {
	propertyName: string;
}

/** Full-field `PropertyUpdateInput`. */
export interface PropertyFullUpdateInput extends PropertyFullSharedInput {
	id: string;
	propertyName?: string | undefined;
}

const PROPERTY_FULL_FIELDS = `
	id
	propertyName
	propertyType
	listedForSale
	listedForRent
	listedForLease
	listedInDirectory
	tags
	community {
		id
	}
	owner {
		id
		memberName
	}
	location {
		address {
			streetNumber
			streetName
			municipality
			countrySubdivision
			postalCode
			country
		}
	}
	listingDetail {
		price
		rentHigh
		rentLow
		lease
		maxGuests
		bedrooms
		bathrooms
		squareFeet
		yearBuilt
		lotSize
		description
		amenities
		bedroomDetails {
			id
			roomName
			bedDescriptions
		}
		additionalAmenities {
			id
			category
			amenities
		}
		images
		video
		floorPlan
		floorPlanImages
		listingAgent
		listingAgentPhone
		listingAgentEmail
		listingAgentWebsite
		listingAgentCompany
		listingAgentCompanyPhone
		listingAgentCompanyEmail
		listingAgentCompanyWebsite
		listingAgentCompanyAddress
	}
	createdAt
	updatedAt
`;

export const PROPERTIES_FULL_BY_COMMUNITY_ID_QUERY = `
	query PropertiesFullByCommunityId($communityId: ObjectID!) {
		propertiesByCommunityId(communityId: $communityId) {
			${PROPERTY_FULL_FIELDS}
		}
	}
`;

export const PROPERTY_FULL_CREATE_MUTATION = `
	mutation PropertyFullCreate($input: PropertyCreateInput!) {
		propertyCreate(input: $input) {
			status {
				success
				errorMessage
			}
			property {
				${PROPERTY_FULL_FIELDS}
			}
		}
	}
`;

export const PROPERTY_FULL_UPDATE_MUTATION = `
	mutation PropertyFullUpdate($input: PropertyUpdateInput!) {
		propertyUpdate(input: $input) {
			status {
				success
				errorMessage
			}
			property {
				${PROPERTY_FULL_FIELDS}
			}
		}
	}
`;
