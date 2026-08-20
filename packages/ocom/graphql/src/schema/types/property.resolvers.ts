import type {
	ApplicationServices,
	PropertyAdditionalAmenityCommand,
	PropertyAddressFieldsCommand,
	PropertyBedroomDetailCommand,
	PropertyCreateCommand,
	PropertyFieldsCommand,
	PropertyListingDetailFieldsCommand,
	PropertyUpdateCommand,
} from '@ocom/application-services';
import type { Domain } from '@ocom/domain';
import DataLoader from 'dataloader';
import type { GraphQLResolveInfo } from 'graphql';
import type { PropertyAdditionalAmenityInput, PropertyAddressInput, PropertyBedroomDetailInput, PropertyCreateInput, PropertyDeleteInput, PropertyListingDetailInput, PropertyUpdateInput, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

type MemberEntityReference = Domain.Contexts.Community.Member.MemberEntityReference;

/**
 * Per-request owner loaders, keyed by the request-scoped ApplicationServices
 * instance. Batching concurrent Property.owner resolutions into a single
 * readonly member query avoids the N+1 pattern on property lists, while the
 * WeakMap guarantees no batch or cached member ever crosses request (and
 * therefore passport) boundaries.
 */
const ownerLoaders = new WeakMap<ApplicationServices, DataLoader<string, MemberEntityReference | null>>();

const ownerLoaderFor = (context: GraphContext): DataLoader<string, MemberEntityReference | null> => {
	let loader = ownerLoaders.get(context.applicationServices);
	if (!loader) {
		loader = new DataLoader<string, MemberEntityReference | null>(async (ids) => {
			const members = await context.applicationServices.Community.Member.queryByIdsWithRole({ ids: [...ids] });
			const membersById = new Map(members.map((member) => [member.id, member]));
			return ids.map((id) => membersById.get(id) ?? null);
		});
		ownerLoaders.set(context.applicationServices, loader);
	}
	return loader;
};

const DUPLICATE_PROPERTY_NAME_MESSAGE = 'A property with this name already exists';

/**
 * Detects a MongoDB duplicate-key error (E11000) defensively via the numeric
 * server code and/or the raw message, so the raw index error never leaks to
 * users when the friendly pre-check loses the check-then-write race.
 */
const isDuplicateKeyError = (error: unknown): boolean => {
	if (typeof error !== 'object' || error === null) {
		return false;
	}
	const { code, message } = error as { code?: unknown; message?: unknown };
	return code === 11000 || (typeof message === 'string' && message.includes('E11000'));
};

const PropertyMutationResolver = async (getProperty: Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null>) => {
	try {
		return {
			status: { success: true },
			property: await getProperty,
		};
	} catch (error) {
		console.error('Property > Mutation : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: isDuplicateKeyError(error) ? DUPLICATE_PROPERTY_NAME_MESSAGE : message },
		};
	}
};

const toAddressCommand = (input: PropertyAddressInput): PropertyAddressFieldsCommand => {
	const address: PropertyAddressFieldsCommand = {};
	// Explicit null clears an address field to an empty value; undefined leaves it untouched.
	if (input.streetNumber !== undefined) {
		address.streetNumber = input.streetNumber;
	}
	if (input.streetName !== undefined) {
		address.streetName = input.streetName;
	}
	if (input.municipality !== undefined) {
		address.municipality = input.municipality;
	}
	if (input.countrySubdivision !== undefined) {
		address.countrySubdivision = input.countrySubdivision;
	}
	if (input.postalCode !== undefined) {
		address.postalCode = input.postalCode;
	}
	if (input.country !== undefined) {
		address.country = input.country;
	}
	return address;
};

const toBedroomDetailCommand = (input: PropertyBedroomDetailInput): PropertyBedroomDetailCommand => {
	const row: PropertyBedroomDetailCommand = {};
	if (input.roomName !== undefined && input.roomName !== null) {
		row.roomName = input.roomName;
	}
	if (input.bedDescriptions !== undefined && input.bedDescriptions !== null) {
		row.bedDescriptions = [...input.bedDescriptions];
	}
	return row;
};

const toAdditionalAmenityCommand = (input: PropertyAdditionalAmenityInput): PropertyAdditionalAmenityCommand => {
	const row: PropertyAdditionalAmenityCommand = {};
	if (input.category !== undefined && input.category !== null) {
		row.category = input.category;
	}
	if (input.amenities !== undefined && input.amenities !== null) {
		row.amenities = [...input.amenities];
	}
	return row;
};

const toListingDetailCommand = (input: PropertyListingDetailInput): PropertyListingDetailFieldsCommand => {
	const listingDetail: PropertyListingDetailFieldsCommand = {};
	// Listing fields: explicit null is a deliberate clear and must be forwarded.
	if (input.price !== undefined) {
		listingDetail.price = input.price;
	}
	if (input.rentHigh !== undefined) {
		listingDetail.rentHigh = input.rentHigh;
	}
	if (input.rentLow !== undefined) {
		listingDetail.rentLow = input.rentLow;
	}
	if (input.lease !== undefined) {
		listingDetail.lease = input.lease;
	}
	if (input.maxGuests !== undefined) {
		listingDetail.maxGuests = input.maxGuests;
	}
	if (input.bedrooms !== undefined) {
		listingDetail.bedrooms = input.bedrooms;
	}
	if (input.bathrooms !== undefined) {
		listingDetail.bathrooms = input.bathrooms;
	}
	if (input.squareFeet !== undefined) {
		listingDetail.squareFeet = input.squareFeet;
	}
	if (input.yearBuilt !== undefined) {
		listingDetail.yearBuilt = input.yearBuilt;
	}
	if (input.lotSize !== undefined) {
		listingDetail.lotSize = input.lotSize;
	}
	if (input.description !== undefined) {
		listingDetail.description = input.description;
	}
	if (input.amenities !== undefined) {
		listingDetail.amenities = input.amenities === null ? null : [...input.amenities];
	}
	if (input.images !== undefined) {
		listingDetail.images = input.images === null ? null : [...input.images];
	}
	if (input.video !== undefined) {
		listingDetail.video = input.video;
	}
	if (input.floorPlan !== undefined) {
		listingDetail.floorPlan = input.floorPlan;
	}
	if (input.floorPlanImages !== undefined) {
		listingDetail.floorPlanImages = input.floorPlanImages === null ? null : [...input.floorPlanImages];
	}
	if (input.listingAgent !== undefined) {
		listingDetail.listingAgent = input.listingAgent;
	}
	if (input.listingAgentPhone !== undefined) {
		listingDetail.listingAgentPhone = input.listingAgentPhone;
	}
	if (input.listingAgentEmail !== undefined) {
		listingDetail.listingAgentEmail = input.listingAgentEmail;
	}
	if (input.listingAgentWebsite !== undefined) {
		listingDetail.listingAgentWebsite = input.listingAgentWebsite;
	}
	if (input.listingAgentCompany !== undefined) {
		listingDetail.listingAgentCompany = input.listingAgentCompany;
	}
	if (input.listingAgentCompanyPhone !== undefined) {
		listingDetail.listingAgentCompanyPhone = input.listingAgentCompanyPhone;
	}
	if (input.listingAgentCompanyEmail !== undefined) {
		listingDetail.listingAgentCompanyEmail = input.listingAgentCompanyEmail;
	}
	if (input.listingAgentCompanyWebsite !== undefined) {
		listingDetail.listingAgentCompanyWebsite = input.listingAgentCompanyWebsite;
	}
	if (input.listingAgentCompanyAddress !== undefined) {
		listingDetail.listingAgentCompanyAddress = input.listingAgentCompanyAddress;
	}
	// Bedroom details and additional amenity rows are replaced wholesale when provided.
	if (input.bedroomDetails !== undefined && input.bedroomDetails !== null) {
		listingDetail.bedroomDetails = input.bedroomDetails.map(toBedroomDetailCommand);
	}
	if (input.additionalAmenities !== undefined && input.additionalAmenities !== null) {
		listingDetail.additionalAmenities = input.additionalAmenities.map(toAdditionalAmenityCommand);
	}
	return listingDetail;
};

/**
 * Copies the user-manageable fields shared by the create and update inputs
 * onto an application-service command, preserving the explicit-null-clears /
 * undefined-leaves-untouched semantics per field.
 */
const applySharedPropertyInput = (input: PropertyCreateInput | PropertyUpdateInput, command: PropertyFieldsCommand): void => {
	// Explicit null propertyType is a deliberate clear and must be forwarded.
	if (input.propertyType !== undefined) {
		command.propertyType = input.propertyType;
	}
	// Explicit null ownerId is a deliberate clear and must be forwarded.
	if (input.ownerId !== undefined) {
		command.ownerId = input.ownerId === null ? null : String(input.ownerId);
	}
	if (input.listedForSale !== undefined && input.listedForSale !== null) {
		command.listedForSale = input.listedForSale;
	}
	if (input.listedForRent !== undefined && input.listedForRent !== null) {
		command.listedForRent = input.listedForRent;
	}
	if (input.listedForLease !== undefined && input.listedForLease !== null) {
		command.listedForLease = input.listedForLease;
	}
	if (input.listedInDirectory !== undefined && input.listedInDirectory !== null) {
		command.listedInDirectory = input.listedInDirectory;
	}
	if (input.tags !== undefined) {
		// null clears the list, matching the null-clear semantics of the
		// listing-detail list fields (e.g. amenities).
		command.tags = input.tags === null ? [] : [...input.tags];
	}
	if (input.location !== undefined && input.location !== null && input.location.address !== undefined && input.location.address !== null) {
		command.location = { address: toAddressCommand(input.location.address) };
	}
	if (input.listingDetail !== undefined && input.listingDetail !== null) {
		command.listingDetail = toListingDetailCommand(input.listingDetail);
	}
};

/**
 * Admin-side property reads are authorized in the application services via the
 * request passport's property visa (built from the request's current
 * member/community hints), which requires `canManageProperties` in the
 * property's community. Resolvers only pre-check that a verified user exists.
 */
const property: Resolvers = {
	Property: {
		owner: async (parent, _args, context: GraphContext) => {
			const ownerRef = parent.owner as { id?: string } | string | null | undefined;
			const ownerId = typeof ownerRef === 'string' ? ownerRef : ownerRef?.id;
			if (!ownerId) {
				return null;
			}
			// Resolve through the readonly member read model: the domain adapter's owner
			// exposes a non-iterable accounts collection that GraphQL cannot serialize,
			// and the per-request loader batches all owner lookups of a property list
			// into one query without opening any transaction.
			return await ownerLoaderFor(context).load(ownerId);
		},
	},
	Query: {
		property: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const foundProperty = await context.applicationServices.Property.Property.queryById({
				id: args.id,
			});
			if (!foundProperty) {
				return null;
			}
			return foundProperty;
		},
		propertiesByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Property.Property.queryByCommunityId({
				communityId: args.communityId,
			});
		},
	},
	Mutation: {
		propertyCreate: async (_parent, args: { input: PropertyCreateInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			const communityId = context.applicationServices.verifiedUser?.hints?.communityId;
			if (!communityId) {
				return { status: { success: false, errorMessage: 'No current community found' } };
			}
			const createCommand: PropertyCreateCommand = {
				propertyName: args.input.propertyName,
				communityId: communityId,
			};
			applySharedPropertyInput(args.input, createCommand);
			// Return the committed entity directly (matching the community/member
			// mutation pattern): coupling mutation status to a separate post-commit
			// read would report failure for an already-committed write, prompting
			// clients to retry into the duplicate-name error.
			return await PropertyMutationResolver(context.applicationServices.Property.Property.create(createCommand));
		},
		propertyUpdate: async (_parent, args: { input: PropertyUpdateInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			const updateCommand: PropertyUpdateCommand = {
				id: args.input.id,
			};
			if (args.input.propertyName !== null && args.input.propertyName !== undefined) {
				updateCommand.propertyName = args.input.propertyName;
			}
			applySharedPropertyInput(args.input, updateCommand);
			// See propertyCreate: the committed entity is the payload; no post-commit read.
			return await PropertyMutationResolver(context.applicationServices.Property.Property.update(updateCommand));
		},
		propertyDelete: async (_parent, args: { input: PropertyDeleteInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			return await PropertyMutationResolver(
				context.applicationServices.Property.Property.requestDelete({
					id: args.input.id,
				}).then(() => null),
			);
		},
	},
};

export default property;
