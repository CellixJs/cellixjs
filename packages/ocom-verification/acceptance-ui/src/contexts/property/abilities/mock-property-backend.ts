import type { MockedResponse } from '@apollo/client/testing';
import {
	AdminPropertiesCreateContainerPropertyCreateDocument,
	AdminPropertiesDetailContainerPropertyDeleteDocument,
	AdminPropertiesDetailContainerPropertyDocument,
	AdminPropertiesDetailContainerPropertyUpdateDocument,
	AdminPropertiesListContainerPropertiesDocument,
	AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
} from '../../../../../../ocom/ui-community-route-admin/src/generated.tsx';

/** Community the mocked property-manager member belongs to. */
export const ACTIVE_COMMUNITY_ID = '65e1a77bcf86cd79943900c1';
/** Member id of the acting property manager in the mocked backend. */
const ACTIVE_MEMBER_ID = '65e1a77bcf86cd79943900a1';
/** End user id of the acting property manager in the mocked backend. */
const ACTIVE_END_USER_ID = '65e1a77bcf86cd79943900f1';

/** Router base path of the admin properties section for the mocked member. */
export const PROPERTIES_BASE_PATH = `/community/${ACTIVE_COMMUNITY_ID}/admin/${ACTIVE_MEMBER_ID}/properties`;

interface MockListingDetail {
	bedrooms: number | null;
	bathrooms: number | null;
	squareFeet: number | null;
}

interface MockProperty {
	id: string;
	propertyName: string;
	propertyType: string | null;
	listingDetail: MockListingDetail | null;
	communityId: string;
	deleted: boolean;
	createdAt: string;
	updatedAt: string;
}

/** Outcome of the last mocked property mutation. */
export interface MockMutationResult {
	success: boolean;
	errorMessage?: string | null;
}

// Mock backend state shared by the dynamic Apollo mocks below.
let uiProperties: MockProperty[] = [];
let canManageProperties = true;
let lastMutation: MockMutationResult | undefined;
let lastViewedPropertyCommunityId: string | undefined;
let idCounter = 0;

const nextPropertyId = (): string => {
	idCounter += 1;
	return `65e1b${idCounter.toString(16).padStart(19, '0')}`;
};

const addProperty = (propertyName: string): MockProperty => {
	const now = new Date().toISOString();
	const property: MockProperty = {
		id: nextPropertyId(),
		propertyName,
		propertyType: null,
		listingDetail: null,
		communityId: ACTIVE_COMMUNITY_ID,
		deleted: false,
		createdAt: now,
		updatedAt: now,
	};
	uiProperties.push(property);
	return property;
};

/**
 * Resets the mocked property backend for a new scenario. Called from the
 * property-manager authentication Given.
 */
export function resetPropertyUiState(): void {
	uiProperties = [];
	canManageProperties = true;
	lastMutation = undefined;
	lastViewedPropertyCommunityId = undefined;
}

/** Adds a property to the mocked backend when it is not present yet. */
export function ensureMockProperty(propertyName: string): void {
	if (!uiProperties.some((candidate) => candidate.propertyName === propertyName && !candidate.deleted)) {
		addProperty(propertyName);
	}
}

/** Finds a property in the mocked backend by name, including deleted ones. */
export function findMockPropertyByName(propertyName: string): { id: string; propertyName: string; deleted: boolean } | undefined {
	return uiProperties.find((candidate) => candidate.propertyName === propertyName);
}

/** Number of non-deleted properties currently held by the mocked backend. */
export function mockPropertyCount(): number {
	return uiProperties.filter((property) => !property.deleted).length;
}

/** Outcome of the last mocked property mutation, if any was performed. */
export function lastPropertyMutation(): MockMutationResult | undefined {
	return lastMutation;
}

/** Community id of the property most recently loaded by the detail screen. */
export function lastViewedPropertyCommunity(): string | undefined {
	return lastViewedPropertyCommunityId;
}

const toListingDetailFields = (listingDetail: MockListingDetail | null) =>
	listingDetail
		? {
				__typename: 'PropertyListingDetail' as const,
				bedrooms: listingDetail.bedrooms,
				bathrooms: listingDetail.bathrooms,
				squareFeet: listingDetail.squareFeet,
			}
		: null;

const toDetailFields = (property: MockProperty) => ({
	__typename: 'Property' as const,
	id: property.id,
	propertyName: property.propertyName,
	propertyType: property.propertyType,
	listingDetail: toListingDetailFields(property.listingDetail),
	createdAt: property.createdAt,
	updatedAt: property.updatedAt,
});

const toCreateFields = (property: MockProperty) => ({
	__typename: 'Property' as const,
	id: property.id,
	propertyName: property.propertyName,
	createdAt: property.createdAt,
	updatedAt: property.updatedAt,
});

interface PropertyListingDetailInput {
	bedrooms?: number | null;
	bathrooms?: number | null;
	squareFeet?: number | null;
}

interface PropertyMutationInput {
	id?: string;
	propertyName?: string | null;
	propertyType?: string | null;
	listingDetail?: PropertyListingDetailInput | null;
}

/** Builds the dynamic Apollo mocks backing the admin properties screens. */
export const buildPropertyMocks = (): MockedResponse[] => [
	{
		request: { query: AdminSectionLayoutContainerMembersForCurrentEndUserDocument },
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: () => ({
			data: {
				currentEndUserAndCreateIfNotExists: {
					__typename: 'EndUser' as const,
					id: ACTIVE_END_USER_ID,
				},
				membersForCurrentEndUser: [
					{
						__typename: 'Member' as const,
						id: ACTIVE_MEMBER_ID,
						memberName: 'Alice Property Manager',
						isAdmin: true,
						accounts: [
							{
								__typename: 'MemberAccount' as const,
								statusCode: 'ACCEPTED',
								user: {
									__typename: 'EndUser' as const,
									id: ACTIVE_END_USER_ID,
								},
							},
						],
						role: {
							__typename: 'EndUserRole' as const,
							id: '65e1a77bcf86cd79943900e1',
							permissions: {
								__typename: 'EndUserRolePermissions' as const,
								propertyPermissions: {
									__typename: 'EndUserRolePropertyPermissions' as const,
									canManageProperties,
								},
							},
						},
						community: {
							__typename: 'Community' as const,
							id: ACTIVE_COMMUNITY_ID,
							name: 'Harborview HOA',
						},
					},
				],
			},
		}),
	},
	{
		request: { query: AdminPropertiesListContainerPropertiesDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: () => ({
			data: {
				propertiesByCommunityId: uiProperties.filter((property) => !property.deleted).map(toDetailFields),
			},
		}),
	},
	{
		request: { query: AdminPropertiesDetailContainerPropertyDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { id?: string }) => {
			const property = uiProperties.find((candidate) => candidate.id === variables.id && !candidate.deleted);
			lastViewedPropertyCommunityId = property?.communityId;
			return { data: { property: property ? toDetailFields(property) : null } };
		},
	},
	{
		request: { query: AdminPropertiesCreateContainerPropertyCreateDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: PropertyMutationInput }) => {
			const propertyName = variables.input?.propertyName ?? '';
			if (propertyName.trim().length === 0) {
				lastMutation = { success: false, errorMessage: 'Property name is required' };
				return {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult' as const,
							status: { __typename: 'MutationStatus' as const, success: false, errorMessage: lastMutation.errorMessage },
							property: null,
						},
					},
				};
			}
			const property = addProperty(propertyName);
			lastMutation = { success: true };
			return {
				data: {
					propertyCreate: {
						__typename: 'PropertyMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
						property: toCreateFields(property),
					},
				},
			};
		},
	},
	{
		request: { query: AdminPropertiesDetailContainerPropertyUpdateDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: PropertyMutationInput }) => {
			const property = uiProperties.find((candidate) => candidate.id === variables.input?.id && !candidate.deleted);
			if (!property) {
				lastMutation = { success: false, errorMessage: 'Property not found' };
				return {
					data: {
						propertyUpdate: {
							__typename: 'PropertyMutationResult' as const,
							status: { __typename: 'MutationStatus' as const, success: false, errorMessage: lastMutation.errorMessage },
							property: null,
						},
					},
				};
			}
			property.propertyName = variables.input?.propertyName ?? property.propertyName;
			if (variables.input?.propertyType !== undefined && variables.input.propertyType !== null) {
				property.propertyType = variables.input.propertyType;
			}
			const listingDetailInput = variables.input?.listingDetail;
			if (listingDetailInput) {
				property.listingDetail = {
					bedrooms: listingDetailInput.bedrooms ?? property.listingDetail?.bedrooms ?? null,
					bathrooms: listingDetailInput.bathrooms ?? property.listingDetail?.bathrooms ?? null,
					squareFeet: listingDetailInput.squareFeet ?? property.listingDetail?.squareFeet ?? null,
				};
			}
			property.updatedAt = new Date().toISOString();
			lastMutation = { success: true };
			return {
				data: {
					propertyUpdate: {
						__typename: 'PropertyMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
						property: toDetailFields(property),
					},
				},
			};
		},
	},
	{
		request: { query: AdminPropertiesDetailContainerPropertyDeleteDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: PropertyMutationInput }) => {
			const property = uiProperties.find((candidate) => candidate.id === variables.input?.id && !candidate.deleted);
			if (!property) {
				lastMutation = { success: false, errorMessage: 'Property not found' };
				return {
					data: {
						propertyDelete: {
							__typename: 'PropertyMutationResult' as const,
							status: { __typename: 'MutationStatus' as const, success: false, errorMessage: lastMutation.errorMessage },
						},
					},
				};
			}
			property.deleted = true;
			property.updatedAt = new Date().toISOString();
			lastMutation = { success: true };
			return {
				data: {
					propertyDelete: {
						__typename: 'PropertyMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
					},
				},
			};
		},
	},
];
