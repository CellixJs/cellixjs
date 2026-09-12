import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface PropertyAddressFieldsCommand {
	streetNumber?: string | null;
	streetName?: string | null;
	municipality?: string | null;
	countrySubdivision?: string | null;
	postalCode?: string | null;
	country?: string | null;
}

export interface PropertyLocationFieldsCommand {
	address?: PropertyAddressFieldsCommand;
}

export interface PropertyBedroomDetailCommand {
	roomName?: string;
	bedDescriptions?: string[];
}

export interface PropertyAdditionalAmenityCommand {
	category?: string;
	amenities?: string[];
}

export interface PropertyListingDetailFieldsCommand {
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
	bedroomDetails?: PropertyBedroomDetailCommand[];
	additionalAmenities?: PropertyAdditionalAmenityCommand[];
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

/**
 * User-manageable property fields shared by the create and update commands.
 * Every field is optional: `undefined` leaves the current value untouched and
 * an explicit `null` clears the value (where the domain allows clearing).
 */
export interface PropertyFieldsCommand {
	propertyType?: string | null;
	ownerId?: string | null;
	listedForSale?: boolean;
	listedForRent?: boolean;
	listedForLease?: boolean;
	listedInDirectory?: boolean;
	tags?: string[];
	location?: PropertyLocationFieldsCommand;
	listingDetail?: PropertyListingDetailFieldsCommand;
}

type PropertyAggregate = Domain.Contexts.Property.Property.Property<Domain.Contexts.Property.Property.PropertyProps>;

const resolveAddressField = (next: string | null | undefined, current: string): string => {
	// undefined keeps the stored value; explicit null (or '') clears it to ''.
	return next === undefined ? current : (next ?? '');
};

async function applyOwner(dataSources: DataSources, property: PropertyAggregate, ownerId: string | null): Promise<void> {
	if (ownerId === null) {
		property.owner = null;
		return;
	}
	const member = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithRole(ownerId);
	if (!member) {
		throw new Error(`Owner member with id ${ownerId} not found`);
	}
	if (member.communityId !== property.community.id) {
		throw new Error("Owner member does not belong to the property's community");
	}
	property.owner = member;
}

function applyAddress(property: PropertyAggregate, address: PropertyAddressFieldsCommand): void {
	const location = property.location as Domain.Contexts.Property.Property.PropertyLocation;
	const current = location.address;
	// The location entity requires the full address shape, so unspecified
	// fields (including the ones not exposed through the API) keep their
	// currently stored values.
	location.address = {
		streetNumber: resolveAddressField(address.streetNumber, current.streetNumber),
		streetName: resolveAddressField(address.streetName, current.streetName),
		municipality: resolveAddressField(address.municipality, current.municipality),
		municipalitySubdivision: current.municipalitySubdivision,
		localName: current.localName,
		countrySecondarySubdivision: current.countrySecondarySubdivision,
		countryTertiarySubdivision: current.countryTertiarySubdivision,
		countrySubdivision: resolveAddressField(address.countrySubdivision, current.countrySubdivision),
		countrySubdivisionName: current.countrySubdivisionName,
		postalCode: resolveAddressField(address.postalCode, current.postalCode),
		extendedPostalCode: current.extendedPostalCode,
		countryCode: current.countryCode,
		country: resolveAddressField(address.country, current.country),
		countryCodeISO3: current.countryCodeISO3,
		freeformAddress: current.freeformAddress,
		streetNameAndNumber: current.streetNameAndNumber,
		routeNumbers: current.routeNumbers,
		crossStreet: current.crossStreet,
	};
}

function applyBedroomDetails(listingDetail: Domain.Contexts.Property.Property.PropertyListingDetail, bedroomDetails: PropertyBedroomDetailCommand[]): void {
	// Rows are replaced wholesale: remove every stored row, then add the new set.
	for (const existing of listingDetail.bedroomDetails) {
		listingDetail.requestRemoveBedroom(existing.props);
	}
	for (const detail of bedroomDetails) {
		const bedroom = listingDetail.requestNewBedroom();
		if (detail.roomName !== undefined) {
			bedroom.roomName = new Domain.Contexts.Property.Property.BedroomDetailValueObjects.RoomName(detail.roomName);
		}
		if (detail.bedDescriptions !== undefined) {
			bedroom.bedDescriptions = new Domain.Contexts.Property.Property.BedroomDetailValueObjects.BedDescriptions(detail.bedDescriptions);
		}
	}
}

function applyAdditionalAmenities(listingDetail: Domain.Contexts.Property.Property.PropertyListingDetail, additionalAmenities: PropertyAdditionalAmenityCommand[]): void {
	// Rows are replaced wholesale: remove every stored row, then add the new set.
	for (const existing of listingDetail.additionalAmenities) {
		listingDetail.requestRemoveAdditionalAmenity(existing.props);
	}
	for (const amenityGroup of additionalAmenities) {
		const additionalAmenity = listingDetail.requestNewAdditionalAmenity();
		if (amenityGroup.category !== undefined) {
			additionalAmenity.category = new Domain.Contexts.Property.Property.AdditionalAmenityValueObjects.Category(amenityGroup.category);
		}
		if (amenityGroup.amenities !== undefined) {
			additionalAmenity.amenities = new Domain.Contexts.Property.Property.AdditionalAmenityValueObjects.Amenities(amenityGroup.amenities);
		}
	}
}

function applyListingDetail(property: PropertyAggregate, command: PropertyListingDetailFieldsCommand): void {
	const listingDetail = property.listingDetail as Domain.Contexts.Property.Property.PropertyListingDetail;
	const valueObjects = Domain.Contexts.Property.Property.ListingDetailValueObjects;
	// Explicit null clears a value; undefined leaves it untouched.
	if (command.price !== undefined) {
		listingDetail.price = new valueObjects.Price(command.price);
	}
	if (command.rentHigh !== undefined) {
		listingDetail.rentHigh = new valueObjects.RentHigh(command.rentHigh);
	}
	if (command.rentLow !== undefined) {
		listingDetail.rentLow = new valueObjects.RentLow(command.rentLow);
	}
	if (command.lease !== undefined) {
		listingDetail.lease = new valueObjects.Lease(command.lease);
	}
	if (command.maxGuests !== undefined) {
		listingDetail.maxGuests = new valueObjects.MaxGuests(command.maxGuests);
	}
	if (command.bedrooms !== undefined) {
		listingDetail.bedrooms = new valueObjects.Bedrooms(command.bedrooms);
	}
	if (command.bathrooms !== undefined) {
		listingDetail.bathrooms = new valueObjects.Bathrooms(command.bathrooms);
	}
	if (command.squareFeet !== undefined) {
		listingDetail.squareFeet = new valueObjects.SquareFeet(command.squareFeet);
	}
	if (command.yearBuilt !== undefined) {
		listingDetail.yearBuilt = new valueObjects.YearBuilt(command.yearBuilt);
	}
	if (command.lotSize !== undefined) {
		listingDetail.lotSize = new valueObjects.LotSize(command.lotSize);
	}
	if (command.description !== undefined) {
		listingDetail.description = new valueObjects.Description(command.description);
	}
	if (command.amenities !== undefined) {
		listingDetail.amenities = new valueObjects.Amenities(command.amenities);
	}
	if (command.images !== undefined) {
		listingDetail.images = new valueObjects.Images(command.images);
	}
	if (command.video !== undefined) {
		listingDetail.video = new valueObjects.Video(command.video);
	}
	if (command.floorPlan !== undefined) {
		listingDetail.floorPlan = new valueObjects.FloorPlan(command.floorPlan);
	}
	if (command.floorPlanImages !== undefined) {
		listingDetail.floorPlanImages = new valueObjects.FloorPlanImages(command.floorPlanImages);
	}
	if (command.listingAgent !== undefined) {
		listingDetail.listingAgent = new valueObjects.ListingAgent(command.listingAgent);
	}
	if (command.listingAgentPhone !== undefined) {
		listingDetail.listingAgentPhone = new valueObjects.ListingAgentPhone(command.listingAgentPhone);
	}
	if (command.listingAgentEmail !== undefined) {
		listingDetail.listingAgentEmail = new valueObjects.ListingAgentEmail(command.listingAgentEmail);
	}
	if (command.listingAgentWebsite !== undefined) {
		listingDetail.listingAgentWebsite = new valueObjects.ListingAgentWebsite(command.listingAgentWebsite);
	}
	if (command.listingAgentCompany !== undefined) {
		listingDetail.listingAgentCompany = new valueObjects.ListingAgentCompany(command.listingAgentCompany);
	}
	if (command.listingAgentCompanyPhone !== undefined) {
		listingDetail.listingAgentCompanyPhone = new valueObjects.ListingAgentCompanyPhone(command.listingAgentCompanyPhone);
	}
	if (command.listingAgentCompanyEmail !== undefined) {
		listingDetail.listingAgentCompanyEmail = new valueObjects.ListingAgentCompanyEmail(command.listingAgentCompanyEmail);
	}
	if (command.listingAgentCompanyWebsite !== undefined) {
		listingDetail.listingAgentCompanyWebsite = new valueObjects.ListingAgentCompanyWebsite(command.listingAgentCompanyWebsite);
	}
	if (command.listingAgentCompanyAddress !== undefined) {
		listingDetail.listingAgentCompanyAddress = new valueObjects.ListingAgentCompanyAddress(command.listingAgentCompanyAddress);
	}
	if (command.bedroomDetails !== undefined) {
		applyBedroomDetails(listingDetail, command.bedroomDetails);
	}
	if (command.additionalAmenities !== undefined) {
		applyAdditionalAmenities(listingDetail, command.additionalAmenities);
	}
}

/**
 * Applies the shared user-manageable property fields to a property aggregate
 * within an open unit-of-work transaction. Used by both the create and update
 * application services; the aggregate setters enforce authorization.
 */
export async function applyPropertyFields(dataSources: DataSources, property: PropertyAggregate, command: PropertyFieldsCommand): Promise<void> {
	// Explicit null clears the property type; undefined leaves it untouched.
	if (command.propertyType !== undefined) {
		property.propertyType = command.propertyType;
	}
	if (command.listedForSale !== undefined) {
		property.listedForSale = command.listedForSale;
	}
	if (command.listedForRent !== undefined) {
		property.listedForRent = command.listedForRent;
	}
	if (command.listedForLease !== undefined) {
		property.listedForLease = command.listedForLease;
	}
	if (command.listedInDirectory !== undefined) {
		property.listedInDirectory = command.listedInDirectory;
	}
	if (command.tags !== undefined) {
		property.tags = [...command.tags];
	}
	if (command.location?.address !== undefined) {
		applyAddress(property, command.location.address);
	}
	if (command.listingDetail !== undefined) {
		applyListingDetail(property, command.listingDetail);
	}
	// Explicit null clears the owner; undefined leaves it untouched.
	if (command.ownerId !== undefined) {
		await applyOwner(dataSources, property, command.ownerId);
	}
}
