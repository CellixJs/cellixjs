import type { MockedResponse } from '@apollo/client/testing';
import { MemberPropertiesListDocument, MemberPropertiesRouteGuardMembersForCurrentEndUserDocument, MemberPropertyCreateDocument, MemberPropertyDetailDocument, MemberPropertyUpdateDocument } from '@ocom/ui-community-route-member';
import { GraphQLError } from 'graphql';

const MEMBER_PROPERTY_COMMUNITY_ID = '65e1a77bcf86cd79943900c1';
const MEMBER_PROPERTY_OWN_EDITOR_ID = '65e1a77bcf86cd79943900a2';
const MEMBER_PROPERTY_MANAGER_ID = '65e1a77bcf86cd79943900a1';
const MEMBER_PROPERTY_FOREIGN_OWNER_ID = '65e1a77bcf86cd79943900a3';
export const MEMBER_PROPERTY_FOREIGN_OWNER_NAME = 'Foreign Same-Community Owner';
const MEMBER_PROPERTY_BASE_PATH = `/community/${MEMBER_PROPERTY_COMMUNITY_ID}/member/${MEMBER_PROPERTY_OWN_EDITOR_ID}/properties`;
export const MEMBER_PROPERTY_ADMIN_BASE_PATH = `/community/${MEMBER_PROPERTY_COMMUNITY_ID}/admin/${MEMBER_PROPERTY_MANAGER_ID}/properties`;

export type MemberPropertyUiVisitor = 'own-editor' | 'manager' | 'no-permission' | 'no-role' | 'nonaccepted' | 'guest' | 'mismatched-route';

interface MemberPropertyMockRecord {
	id: string;
	propertyName: string;
	propertyType: string | null;
	listedInDirectory: boolean;
	ownerId: string;
	deleted: boolean;
}

interface MemberPropertyMutationInput {
	id?: string;
	propertyName?: string;
	propertyType?: string | null;
	ownerId?: string | null;
	listedInDirectory?: boolean;
}

const CURRENT_END_USER_ID = '65e1a77bcf86cd79943900e1';

let visitor: MemberPropertyUiVisitor = 'own-editor';
let properties: MemberPropertyMockRecord[] = [];
let nextId = 0;

export function resetMemberPropertyUiState(): void {
	visitor = 'own-editor';
	properties = [];
	nextId = 0;
}

export function useMemberPropertyUiVisitor(nextVisitor: MemberPropertyUiVisitor): void {
	visitor = nextVisitor;
}

export function memberPropertyRouteFor(activeVisitor = visitor): string {
	if (activeVisitor === 'manager') {
		return `/community/${MEMBER_PROPERTY_COMMUNITY_ID}/member/${MEMBER_PROPERTY_MANAGER_ID}/properties`;
	}
	if (activeVisitor === 'mismatched-route') {
		return `/community/${MEMBER_PROPERTY_COMMUNITY_ID}/member/65e1a77bcf86cd79943900ff/properties`;
	}
	return MEMBER_PROPERTY_BASE_PATH;
}

export function ensureForeignMemberProperty(propertyName: string): void {
	if (properties.some((property) => property.propertyName === propertyName && !property.deleted)) {
		return;
	}
	properties.push({
		id: nextPropertyId(),
		propertyName,
		propertyType: null,
		listedInDirectory: false,
		ownerId: MEMBER_PROPERTY_FOREIGN_OWNER_ID,
		deleted: false,
	});
}

export function ensureOwnMemberProperty(propertyName: string): void {
	if (properties.some((property) => property.propertyName === propertyName && !property.deleted)) {
		return;
	}
	properties.push({
		id: nextPropertyId(),
		propertyName,
		propertyType: null,
		listedInDirectory: false,
		ownerId: MEMBER_PROPERTY_OWN_EDITOR_ID,
		deleted: false,
	});
}

/** Read-only inspection of the mock persistence state used by member UI assertions. */
export function memberPropertyMockRecord(propertyName: string): MemberPropertyMockRecord | undefined {
	return properties.find((property) => property.propertyName === propertyName && !property.deleted);
}

const nextPropertyId = (): string => {
	nextId += 1;
	return `65e1b${nextId.toString(16).padStart(19, '0')}`;
};

const mayView = (): boolean => visitor === 'own-editor' || visitor === 'manager';
const mayManage = (): boolean => visitor === 'manager';
const mayEdit = (property: MemberPropertyMockRecord): boolean => mayManage() || (visitor === 'own-editor' && property.ownerId === MEMBER_PROPERTY_OWN_EDITOR_ID);

const toListProperty = (property: MemberPropertyMockRecord) => ({
	__typename: 'Property' as const,
	id: property.id,
	propertyName: property.propertyName,
	propertyType: property.propertyType,
	listingDetail: null,
	location: null,
	updatedAt: null,
});

const toDetailProperty = (property: MemberPropertyMockRecord) => ({
	__typename: 'Property' as const,
	id: property.id,
	propertyName: property.propertyName,
	propertyType: property.propertyType,
	listedForSale: false,
	listedForRent: false,
	listedForLease: false,
	listedInDirectory: property.listedInDirectory,
	tags: [],
	owner: { __typename: 'PropertyOwnerOption' as const, id: property.ownerId },
	location: {
		__typename: 'PropertyLocation' as const,
		address: {
			__typename: 'PropertyAddress' as const,
			streetNumber: null,
			streetName: null,
			municipality: null,
			countrySubdivision: null,
			postalCode: null,
			country: null,
		},
	},
	listingDetail: {
		__typename: 'PropertyListingDetail' as const,
		price: null,
		rentHigh: null,
		rentLow: null,
		lease: null,
		maxGuests: null,
		bedrooms: null,
		bathrooms: null,
		squareFeet: null,
		yearBuilt: null,
		lotSize: null,
		description: null,
		amenities: [],
		bedroomDetails: [],
		additionalAmenities: [],
		images: [],
		video: null,
		floorPlan: null,
		floorPlanImages: [],
		listingAgent: null,
		listingAgentPhone: null,
		listingAgentEmail: null,
		listingAgentWebsite: null,
		listingAgentCompany: null,
		listingAgentCompanyPhone: null,
		listingAgentCompanyEmail: null,
		listingAgentCompanyWebsite: null,
		listingAgentCompanyAddress: null,
	},
	createdAt: null,
	updatedAt: null,
});

const toCreateProperty = (property: MemberPropertyMockRecord) => ({
	__typename: 'Property' as const,
	id: property.id,
	propertyName: property.propertyName,
	owner: { __typename: 'PropertyOwnerOption' as const, id: property.ownerId },
});

const rejectedMutation = (field: 'propertyCreate' | 'propertyUpdate', errorMessage: string) => ({
	data: {
		[field]: {
			__typename: 'PropertyMutationResult' as const,
			status: { __typename: 'MutationStatus' as const, success: false, errorMessage },
			property: null,
		},
	},
});

const guardMembership = () => {
	if (visitor === 'guest') {
		return [];
	}
	const routeMemberId = visitor === 'manager' ? MEMBER_PROPERTY_MANAGER_ID : MEMBER_PROPERTY_OWN_EDITOR_ID;
	const accepted = visitor !== 'nonaccepted';
	return [
		{
			__typename: 'Member' as const,
			id: routeMemberId,
			accounts: [{ __typename: 'MemberAccount' as const, statusCode: accepted ? 'ACCEPTED' : 'CREATED', user: { __typename: 'EndUser' as const, id: CURRENT_END_USER_ID } }],
			role:
				visitor === 'no-role'
					? null
					: {
							__typename: 'EndUserRole' as const,
							permissions: {
								__typename: 'EndUserRolePermissions' as const,
								propertyPermissions: {
									__typename: 'EndUserRolePropertyPermissions' as const,
									canManageProperties: visitor === 'manager',
									canEditOwnProperty: visitor === 'own-editor',
								},
							},
						},
			community: { __typename: 'Community' as const, id: MEMBER_PROPERTY_COMMUNITY_ID },
		},
	];
};

/**
 * Dynamic route mocks use the actual Phase 3 documents. No owner-options or
 * delete mock is intentionally registered: such a request fails the test.
 */
export const buildMemberPropertyMocks = (): MockedResponse[] => [
	{
		request: { query: MemberPropertiesRouteGuardMembersForCurrentEndUserDocument },
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: () => ({
			data: {
				currentEndUserAndCreateIfNotExists: { __typename: 'EndUser', id: CURRENT_END_USER_ID },
				membersForCurrentEndUser: guardMembership(),
			},
		}),
	},
	{
		request: { query: MemberPropertiesListDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: () => {
			if (!mayView()) return { errors: [new GraphQLError('Unauthorized')] };
			return { data: { propertiesByCommunityId: properties.filter((property) => !property.deleted).map(toListProperty) } };
		},
	},
	{
		request: { query: MemberPropertyDetailDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { id?: string }) => {
			if (!mayView()) return { data: { property: null } };
			const property = properties.find((candidate) => candidate.id === variables.id && !candidate.deleted);
			return { data: { property: property ? toDetailProperty(property) : null } };
		},
	},
	{
		request: { query: MemberPropertyCreateDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: MemberPropertyMutationInput }) => {
			const input = variables.input ?? {};
			if (visitor !== 'own-editor') return rejectedMutation('propertyCreate', 'Unauthorized');
			if (input.ownerId !== undefined) return rejectedMutation('propertyCreate', 'Owner must be assigned by the server');
			if (!input.propertyName?.trim()) return rejectedMutation('propertyCreate', 'Property name is required');
			const property: MemberPropertyMockRecord = {
				id: nextPropertyId(),
				propertyName: input.propertyName,
				propertyType: null,
				listedInDirectory: false,
				ownerId: MEMBER_PROPERTY_OWN_EDITOR_ID,
				deleted: false,
			};
			properties.push(property);
			return {
				data: {
					propertyCreate: {
						__typename: 'PropertyMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
						property: toCreateProperty(property),
					},
				},
			};
		},
	},
	{
		request: { query: MemberPropertyUpdateDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: MemberPropertyMutationInput }) => {
			const input = variables.input ?? {};
			const property = properties.find((candidate) => candidate.id === input.id && !candidate.deleted);
			if (!property || !mayEdit(property)) return rejectedMutation('propertyUpdate', 'Property not found');
			if (!mayManage() && (input.propertyName !== undefined || input.propertyType !== undefined || input.ownerId !== undefined)) {
				return rejectedMutation('propertyUpdate', 'Property not found');
			}
			if (input.listedInDirectory !== undefined) property.listedInDirectory = input.listedInDirectory;
			return {
				data: {
					propertyUpdate: {
						__typename: 'PropertyMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
						property: toDetailProperty(property),
					},
				},
			};
		},
	},
];
