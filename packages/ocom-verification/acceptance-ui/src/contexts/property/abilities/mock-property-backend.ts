import type { MockedResponse } from '@apollo/client/testing';
import {
	AdminPropertiesCreateContainerPropertyCreateDocument,
	AdminPropertiesDetailContainerPropertyDeleteDocument,
	AdminPropertiesDetailContainerPropertyDocument,
	AdminPropertiesDetailContainerPropertyUpdateDocument,
	AdminPropertiesListContainerPropertiesDocument,
	AdminPropertiesOwnerOptionsDocument,
	AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
} from '../../../../../../ocom/ui-community-route-admin/src/generated.tsx';

/** Community the mocked property-manager member belongs to. */
export const ACTIVE_COMMUNITY_ID = '65e1a77bcf86cd79943900c1';
/** Member id of the acting property manager in the mocked backend. */
const ACTIVE_MEMBER_ID = '65e1a77bcf86cd79943900a1';
/** End user id of the acting property manager in the mocked backend. */
const ACTIVE_END_USER_ID = '65e1a77bcf86cd79943900f1';
/** Member name of the acting property manager; the owner select and owner column show this. */
export const MOCK_MEMBER_NAME = 'Alice Property Manager';
/** Validation message for bathrooms values that are not in 0.5 increments. */
const BATHROOMS_INCREMENT_MESSAGE = 'Bathrooms must be in increments of 0.5';

/** Router base path of the admin properties section for the mocked member. */
export const PROPERTIES_BASE_PATH = `/community/${ACTIVE_COMMUNITY_ID}/admin/${ACTIVE_MEMBER_ID}/properties`;

interface MockAddress {
	streetNumber: string | null;
	streetName: string | null;
	municipality: string | null;
	countrySubdivision: string | null;
	postalCode: string | null;
	country: string | null;
}

interface MockBedroomDetail {
	id: string;
	roomName: string | null;
	bedDescriptions: string[] | null;
}

interface MockAdditionalAmenity {
	id: string;
	category: string | null;
	amenities: string[] | null;
}

interface MockListingDetail {
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
	bedroomDetails: MockBedroomDetail[] | null;
	additionalAmenities: MockAdditionalAmenity[] | null;
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

interface MockProperty {
	id: string;
	propertyName: string;
	propertyType: string | null;
	listedForSale: boolean;
	listedForRent: boolean;
	listedForLease: boolean;
	listedInDirectory: boolean;
	tags: string[] | null;
	ownerId: string | null;
	address: MockAddress | null;
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
let createCallCount = 0;
let updateCallCount = 0;
let lastUpdateInput: PropertyMutationInput | undefined;
let createDelayMs = 0;

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
		listedForSale: false,
		listedForRent: false,
		listedForLease: false,
		listedInDirectory: false,
		tags: null,
		ownerId: null,
		address: null,
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
	createCallCount = 0;
	updateCallCount = 0;
	lastUpdateInput = undefined;
	createDelayMs = 0;
}

/** Number of property create requests the mocked backend has received. */
export function propertyCreateCallCount(): number {
	return createCallCount;
}

/** Number of property update requests the mocked backend has received. */
export function propertyUpdateCallCount(): number {
	return updateCallCount;
}

/** Input variables of the most recent property update request, if any. */
export function lastPropertyUpdateInput(): PropertyMutationInput | undefined {
	return lastUpdateInput;
}

/** Delay create-mutation responses so double submissions can race the first response. */
export function delayPropertyCreateResponses(delayMs: number): void {
	createDelayMs = delayMs;
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
				price: listingDetail.price,
				rentHigh: listingDetail.rentHigh,
				rentLow: listingDetail.rentLow,
				lease: listingDetail.lease,
				maxGuests: listingDetail.maxGuests,
				bedrooms: listingDetail.bedrooms,
				bathrooms: listingDetail.bathrooms,
				squareFeet: listingDetail.squareFeet,
				yearBuilt: listingDetail.yearBuilt,
				lotSize: listingDetail.lotSize,
				description: listingDetail.description,
				amenities: listingDetail.amenities,
				bedroomDetails: listingDetail.bedroomDetails?.map((detail) => ({ __typename: 'PropertyBedroomDetail' as const, ...detail })) ?? null,
				additionalAmenities: listingDetail.additionalAmenities?.map((amenity) => ({ __typename: 'PropertyAdditionalAmenity' as const, ...amenity })) ?? null,
				images: listingDetail.images,
				video: listingDetail.video,
				floorPlan: listingDetail.floorPlan,
				floorPlanImages: listingDetail.floorPlanImages,
				listingAgent: listingDetail.listingAgent,
				listingAgentPhone: listingDetail.listingAgentPhone,
				listingAgentEmail: listingDetail.listingAgentEmail,
				listingAgentWebsite: listingDetail.listingAgentWebsite,
				listingAgentCompany: listingDetail.listingAgentCompany,
				listingAgentCompanyPhone: listingDetail.listingAgentCompanyPhone,
				listingAgentCompanyEmail: listingDetail.listingAgentCompanyEmail,
				listingAgentCompanyWebsite: listingDetail.listingAgentCompanyWebsite,
				listingAgentCompanyAddress: listingDetail.listingAgentCompanyAddress,
			}
		: null;

const toDetailFields = (property: MockProperty) => ({
	__typename: 'Property' as const,
	id: property.id,
	propertyName: property.propertyName,
	propertyType: property.propertyType,
	listedForSale: property.listedForSale,
	listedForRent: property.listedForRent,
	listedForLease: property.listedForLease,
	listedInDirectory: property.listedInDirectory,
	tags: property.tags,
	owner: property.ownerId ? { __typename: 'Member' as const, id: property.ownerId, memberName: MOCK_MEMBER_NAME } : null,
	location: property.address ? { __typename: 'PropertyLocation' as const, address: { __typename: 'PropertyAddress' as const, ...property.address } } : null,
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

interface PropertyAddressInput {
	streetNumber?: string | null;
	streetName?: string | null;
	municipality?: string | null;
	countrySubdivision?: string | null;
	postalCode?: string | null;
	country?: string | null;
}

interface PropertyBedroomDetailInput {
	roomName?: string | null;
	bedDescriptions?: string[] | null;
}

interface PropertyAdditionalAmenityInput {
	category?: string | null;
	amenities?: string[] | null;
}

interface PropertyListingDetailInput {
	price?: number | null;
	rentHigh?: number | null;
	rentLow?: number | null;
	lease?: number | null;
	maxGuests?: number | null;
	bedrooms?: number | null;
	bathrooms?: number | null;
	squareFeet?: number | null;
	yearBuilt?: number | null;
	lotSize?: number | null;
	description?: string | null;
	amenities?: string[] | null;
	bedroomDetails?: PropertyBedroomDetailInput[] | null;
	additionalAmenities?: PropertyAdditionalAmenityInput[] | null;
	images?: string[] | null;
	video?: string | null;
	floorPlan?: string | null;
	floorPlanImages?: string[] | null;
	listingAgent?: string | null;
	listingAgentPhone?: string | null;
	listingAgentEmail?: string | null;
	listingAgentWebsite?: string | null;
	listingAgentCompany?: string | null;
	listingAgentCompanyPhone?: string | null;
	listingAgentCompanyEmail?: string | null;
	listingAgentCompanyWebsite?: string | null;
	listingAgentCompanyAddress?: string | null;
}

export interface PropertyMutationInput {
	id?: string;
	propertyName?: string | null;
	propertyType?: string | null;
	ownerId?: string | null;
	listedForSale?: boolean | null;
	listedForRent?: boolean | null;
	listedForLease?: boolean | null;
	listedInDirectory?: boolean | null;
	tags?: string[] | null;
	location?: { address?: PropertyAddressInput | null } | null;
	listingDetail?: PropertyListingDetailInput | null;
}

/** Whether a bathrooms count sits on a 0.5 increment, mirroring the future API rule. */
const isHalfStep = (value: number): boolean => (value * 10) % 5 === 0;

const emptyListingDetail = (): MockListingDetail => ({
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
	amenities: null,
	bedroomDetails: null,
	additionalAmenities: null,
	images: null,
	video: null,
	floorPlan: null,
	floorPlanImages: null,
	listingAgent: null,
	listingAgentPhone: null,
	listingAgentEmail: null,
	listingAgentWebsite: null,
	listingAgentCompany: null,
	listingAgentCompanyPhone: null,
	listingAgentCompanyEmail: null,
	listingAgentCompanyWebsite: null,
	listingAgentCompanyAddress: null,
});

/** Apply the full-field portion of a create/update input to a mocked property. */
const applyPropertyInput = (property: MockProperty, input: PropertyMutationInput): void => {
	if (input.propertyType !== undefined && input.propertyType !== null) {
		property.propertyType = input.propertyType;
	}
	if (input.ownerId !== undefined) {
		property.ownerId = input.ownerId;
	}
	for (const flag of ['listedForSale', 'listedForRent', 'listedForLease', 'listedInDirectory'] as const) {
		const value = input[flag];
		if (value !== undefined && value !== null) {
			property[flag] = value;
		}
	}
	if (input.tags !== undefined) {
		property.tags = input.tags;
	}
	const addressInput = input.location?.address;
	if (addressInput) {
		const existing = property.address;
		property.address = {
			streetNumber: addressInput.streetNumber !== undefined ? addressInput.streetNumber : (existing?.streetNumber ?? null),
			streetName: addressInput.streetName !== undefined ? addressInput.streetName : (existing?.streetName ?? null),
			municipality: addressInput.municipality !== undefined ? addressInput.municipality : (existing?.municipality ?? null),
			countrySubdivision: addressInput.countrySubdivision !== undefined ? addressInput.countrySubdivision : (existing?.countrySubdivision ?? null),
			postalCode: addressInput.postalCode !== undefined ? addressInput.postalCode : (existing?.postalCode ?? null),
			country: addressInput.country !== undefined ? addressInput.country : (existing?.country ?? null),
		};
	}
	const listingDetailInput = input.listingDetail;
	if (listingDetailInput) {
		const detail = property.listingDetail ?? emptyListingDetail();
		for (const key of ['price', 'rentHigh', 'rentLow', 'lease', 'maxGuests', 'bedrooms', 'bathrooms', 'squareFeet', 'yearBuilt', 'lotSize'] as const) {
			const value = listingDetailInput[key];
			if (value !== undefined) {
				detail[key] = value;
			}
		}
		for (const key of [
			'description',
			'video',
			'floorPlan',
			'listingAgent',
			'listingAgentPhone',
			'listingAgentEmail',
			'listingAgentWebsite',
			'listingAgentCompany',
			'listingAgentCompanyPhone',
			'listingAgentCompanyEmail',
			'listingAgentCompanyWebsite',
			'listingAgentCompanyAddress',
		] as const) {
			const value = listingDetailInput[key];
			if (value !== undefined) {
				detail[key] = value;
			}
		}
		for (const key of ['amenities', 'images', 'floorPlanImages'] as const) {
			const value = listingDetailInput[key];
			if (value !== undefined) {
				detail[key] = value;
			}
		}
		if (listingDetailInput.bedroomDetails !== undefined) {
			detail.bedroomDetails =
				listingDetailInput.bedroomDetails?.map((row, index) => ({
					id: `65e1c${index.toString(16).padStart(19, '0')}`,
					roomName: row.roomName ?? null,
					bedDescriptions: row.bedDescriptions ?? null,
				})) ?? null;
		}
		if (listingDetailInput.additionalAmenities !== undefined) {
			detail.additionalAmenities =
				listingDetailInput.additionalAmenities?.map((row, index) => ({
					id: `65e1d${index.toString(16).padStart(19, '0')}`,
					category: row.category ?? null,
					amenities: row.amenities ?? null,
				})) ?? null;
		}
		property.listingDetail = detail;
	}
};

/** Bathrooms outside 0.5 increments are rejected the way the future API will reject them. */
const bathroomsViolation = (input: PropertyMutationInput | undefined): boolean => {
	const bathrooms = input?.listingDetail?.bathrooms;
	return bathrooms !== undefined && bathrooms !== null && !isHalfStep(bathrooms);
};

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
								// The acting persona is a property-only manager: no
								// non-property admin permissions are granted.
								isNonPropertyAdmin: false,
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
		request: { query: AdminPropertiesOwnerOptionsDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: () => ({
			data: {
				membersByCommunityId: [
					{
						__typename: 'Member' as const,
						id: ACTIVE_MEMBER_ID,
						memberName: MOCK_MEMBER_NAME,
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
		// Counting requests in the matcher captures them when they are issued,
		// before any configured response delay elapses.
		variableMatcher: () => {
			createCallCount += 1;
			return true;
		},
		maxUsageCount: Number.POSITIVE_INFINITY,
		delay: createDelayMs,
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
			if (bathroomsViolation(variables.input)) {
				lastMutation = { success: false, errorMessage: BATHROOMS_INCREMENT_MESSAGE };
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
			if (variables.input) {
				applyPropertyInput(property, variables.input);
			}
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
		variableMatcher: (variables: { input?: PropertyMutationInput }) => {
			updateCallCount += 1;
			lastUpdateInput = variables.input;
			return true;
		},
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
			if (bathroomsViolation(variables.input)) {
				lastMutation = { success: false, errorMessage: BATHROOMS_INCREMENT_MESSAGE };
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
			if (variables.input) {
				applyPropertyInput(property, variables.input);
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
