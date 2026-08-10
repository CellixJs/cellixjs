/** Listing detail shape returned on the Property type. */
interface PropertyListingDetailResult {
	price: number | null;
	bedrooms: number | null;
	bathrooms: number | null;
	squareFeet: number | null;
}

/** Property shape returned by the property queries and mutations. */
export interface PropertyResult {
	id: string;
	propertyName: string;
	propertyType: string | null;
	listedForSale: boolean;
	listedForRent: boolean;
	listedForLease: boolean;
	listedInDirectory: boolean;
	community: { id: string };
	owner: { id: string } | null;
	listingDetail: PropertyListingDetailResult | null;
	tags: string[] | null;
}

/** Status block returned by property mutations. */
interface PropertyMutationStatus {
	success: boolean;
	errorMessage?: string | null;
}

/** Result block returned by property mutations. */
export interface PropertyMutationResult {
	status: PropertyMutationStatus;
	property: PropertyResult | null;
}

/** Listing detail fields accepted by the property update flow. */
export interface PropertyListingDetailInput {
	bedrooms?: number | undefined;
	bathrooms?: number | undefined;
	squareFeet?: number | undefined;
}

const PROPERTY_FIELDS = `
	id
	propertyName
	propertyType
	listedForSale
	listedForRent
	listedForLease
	listedInDirectory
	community {
		id
	}
	owner {
		id
	}
	listingDetail {
		price
		bedrooms
		bathrooms
		squareFeet
	}
	tags
	createdAt
	updatedAt
`;

export const PROPERTY_BY_ID_QUERY = `
	query Property($id: ObjectID!) {
		property(id: $id) {
			${PROPERTY_FIELDS}
		}
	}
`;

export const PROPERTIES_BY_COMMUNITY_ID_QUERY = `
	query PropertiesByCommunityId($communityId: ObjectID!) {
		propertiesByCommunityId(communityId: $communityId) {
			${PROPERTY_FIELDS}
		}
	}
`;

export const PROPERTY_CREATE_MUTATION = `
	mutation PropertyCreate($input: PropertyCreateInput!) {
		propertyCreate(input: $input) {
			status {
				success
				errorMessage
			}
			property {
				${PROPERTY_FIELDS}
			}
		}
	}
`;

export const PROPERTY_UPDATE_MUTATION = `
	mutation PropertyUpdate($input: PropertyUpdateInput!) {
		propertyUpdate(input: $input) {
			status {
				success
				errorMessage
			}
			property {
				${PROPERTY_FIELDS}
			}
		}
	}
`;

export const PROPERTY_DELETE_MUTATION = `
	mutation PropertyDelete($input: PropertyDeleteInput!) {
		propertyDelete(input: $input) {
			status {
				success
				errorMessage
			}
			property {
				${PROPERTY_FIELDS}
			}
		}
	}
`;

/** Member shape returned when resolving the acting member for a community. */
export interface CurrentCommunityMemberResult {
	id: string;
	memberName: string | null;
}

/**
 * Resolves the member record of the acting end user in the given community.
 * Used to discover the member id provisioned for a community creator.
 */
export const MEMBER_FOR_CURRENT_COMMUNITY_QUERY = `
	query MemberForCurrentCommunity($communityId: ObjectID!) {
		memberForCurrentCommunity(communityId: $communityId) {
			id
			memberName
		}
	}
`;

/** Property permission flags exposed on the acting member's end-user role. */
export interface MemberRolePropertyPermissionsResult {
	id: string;
	role: {
		id: string;
		permissions: {
			propertyPermissions: {
				canManageProperties: boolean;
				canEditOwnProperty: boolean;
			};
		};
	} | null;
}

/**
 * Reads the property permissions granted by a member's end-user role.
 * Pins the `EndUserRole.permissions.propertyPermissions` GraphQL contract.
 */
export const MEMBER_ROLE_PROPERTY_PERMISSIONS_QUERY = `
	query MemberRolePropertyPermissions($id: ObjectID!) {
		member(id: $id) {
			id
			role {
				id
				permissions {
					propertyPermissions {
						canManageProperties
						canEditOwnProperty
					}
				}
			}
		}
	}
`;
