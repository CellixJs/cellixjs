import type { DomainSeedwork } from '@cellix/domain-seedwork';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import { MemberDomainAdapter } from '../../community/member/member.domain-adapter.ts';

export class PropertyConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Property.Property,
	PropertyDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>
> {
	constructor() {
		super(
			PropertyDomainAdapter,
			Domain.Contexts.Property.Property.Property
		);
	}
}

export class PropertyDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Property.Property>
	implements Domain.Contexts.Property.Property.PropertyProps
{
	get propertyName() {
		return this.doc.propertyName;
	}
	set propertyName(propertyName) {
		this.doc.propertyName = propertyName;
	}

	get propertyType() {
		return this.doc.propertyType || '';
	}
	set propertyType(propertyType) {
		this.doc.propertyType = propertyType;
	}

	get listedForSale() {
		return this.doc.listedForSale;
	}
	set listedForSale(listed) {
		this.doc.listedForSale = listed;
	}

	get listedForRent() {
		return this.doc.listedForRent;
	}
	set listedForRent(listed) {
		this.doc.listedForRent = listed;
	}

	get listedForLease() {
		return this.doc.listedForLease;
	}
	set listedForLease(listed) {
		this.doc.listedForLease = listed;
	}

	get listedInDirectory() {
		return this.doc.listedInDirectory;
	}
	set listedInDirectory(listed) {
		this.doc.listedInDirectory = listed;
	}

	get tags() {
		return [...(this.doc.tags || [])];
	}
	set tags(tags) {
		this.doc.tags = tags;
	}

	get hash() {
		return this.doc.hash;
	}
	set hash(hash) {
		this.doc.hash = hash;
	}

	get lastIndexed() {
		return this.doc.lastIndexed;
	}
	set lastIndexed(lastIndexed) {
		this.doc.lastIndexed = lastIndexed;
	}

	get updateIndexFailedDate() {
		return this.doc.updateIndexFailedDate;
	}
	set updateIndexFailedDate(updateIndexFailedDate) {
		this.doc.updateIndexFailedDate = updateIndexFailedDate;
	}

	get location(): Domain.Contexts.Property.Property.PropertyLocationProps {
		return new PropertyLocationDomainAdapter(this.doc.location);
	}

	get listingDetail(): Domain.Contexts.Property.Property.PropertyListingDetailProps {
		return new PropertyListingDetailDomainAdapter(this.doc.listingDetail);
	}

	get community(): Domain.Contexts.Community.Community.CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			throw new Error(
				'community is not populated or is not of the correct type',
			);
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

	async loadCommunity(): Promise<Domain.Contexts.Community.Community.CommunityProps> {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('community');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

    set community(community: Domain.Contexts.Community.Community.CommunityEntityReference | Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>) {
        //check to see if community is derived from MongooseDomainAdapter
        if (community instanceof Domain.Contexts.Community.Community.Community) {
            this.doc.set('community', community.props.doc);
            return;
        }

        if (!community?.id) {
            throw new Error('community reference is missing id');
        }

        this.doc.set('community', community);
    }

	/**
	 * Exposes the community foreign key as a string regardless of populated state.
	 * Use this in GraphQL field resolvers to fetch the Community via DataLoader/repo.
	 */
	get communityId(): string {
		const c = this.doc.community;
		if (!c) {
			throw new Error('community is not set');
		}
		if (c instanceof MongooseSeedwork.ObjectId) {
			return c.toString();
		}
		// populated doc case
		return (c as Models.Community.Community).id.toString();
	}

	get owner(): Domain.Contexts.Community.Member.MemberEntityReference | null {
		if (!this.doc.owner) {
			return null;
		}
		if (this.doc.owner instanceof MongooseSeedwork.ObjectId) {
			throw new Error(
				'owner is not populated or is not of the correct type',
			);
		}
        // TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.owner as Models.Member.Member) as unknown as Domain.Contexts.Community.Member.MemberEntityReference;
	}

	async loadOwner(): Promise<Domain.Contexts.Community.Member.MemberProps | null> {
		if (!this.doc.owner) {
			return null;
		}
		if (this.doc.owner instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('owner');
		}
		return new MemberDomainAdapter(this.doc.owner as Models.Member.Member);
	}

	/**
	 * Exposes the owner foreign key as a string regardless of populated state.
	 * Use this in GraphQL field resolvers to fetch the Member via DataLoader/repo.
	 */
	get ownerId(): string | null {
		const o = this.doc.owner;
		if (!o) {
			return null;
		}
		if (o instanceof MongooseSeedwork.ObjectId) {
			return o.toString();
		}
		// populated doc case
		return (o as Models.Member.Member).id.toString();
	}

	setOwnerRef(owner: Domain.Contexts.Community.Member.MemberEntityReference | null) {
		if (!owner) {
			this.doc.set('owner', null);
			return;
		}
		if (!owner?.id) {
			throw new Error('owner reference is missing id');
		}
		this.doc.set('owner', new MongooseSeedwork.ObjectId(owner.id));
	}

	override get createdAt(): Date {
		return this.doc.createdAt;
	}

	override get updatedAt(): Date {
		return this.doc.updatedAt;
	}

	override get schemaVersion(): string {
		return this.doc.schemaVersion;
	}
}

class PropertyLocationDomainAdapter implements Domain.Contexts.Property.Property.PropertyLocationProps {
	public readonly doc: Models.Property.Location;
	constructor(doc: Models.Property.Location) {
		this.doc = doc;
	}

	get address(): Domain.Contexts.Property.Property.PropertyLocationAddressProps {
		return new PropertyLocationAddressDomainAdapter(this.doc.address);
	}

	get position(): Domain.Contexts.Property.Property.PropertyLocationPositionProps {
		return new PropertyLocationPositionDomainAdapter(this.doc.position);
	}
}

class PropertyLocationAddressDomainAdapter implements Domain.Contexts.Property.Property.PropertyLocationAddressProps {
	public readonly doc: Models.Property.Location['address'];
	constructor(doc: Models.Property.Location['address']) {
		this.doc = doc;
	}

	get streetNumber(): string {
		return this.doc.streetNumber || '';
	}

	set streetNumber(streetNumber: string) {
		this.doc.streetNumber = streetNumber;
	}

	get streetName(): string {
		return this.doc.streetName || '';
	}

	set streetName(streetName: string) {
		this.doc.streetName = streetName;
	}

	get municipality(): string {
		return this.doc.municipality || '';
	}

	set municipality(municipality: string) {
		this.doc.municipality = municipality;
	}

	get municipalitySubdivision(): string {
		return this.doc.municipalitySubdivision || '';
	}

	set municipalitySubdivision(municipalitySubdivision: string) {
		this.doc.municipalitySubdivision = municipalitySubdivision;
	}

	get localName(): string {
		return this.doc.localName || '';
	}

	set localName(localName: string) {
		this.doc.localName = localName;
	}

	get countrySecondarySubdivision(): string {
		return this.doc.countrySecondarySubdivision || '';
	}

	set countrySecondarySubdivision(countrySecondarySubdivision: string) {
		this.doc.countrySecondarySubdivision = countrySecondarySubdivision;
	}

	get countryTertiarySubdivision(): string {
		return this.doc.countryTertiarySubdivision || '';
	}

	set countryTertiarySubdivision(countryTertiarySubdivision: string) {
		this.doc.countryTertiarySubdivision = countryTertiarySubdivision;
	}

	get countrySubdivision(): string {
		return this.doc.countrySubdivision || '';
	}

	set countrySubdivision(countrySubdivision: string) {
		this.doc.countrySubdivision = countrySubdivision;
	}

	get countrySubdivisionName(): string {
		return this.doc.countrySubdivisionName || '';
	}

	set countrySubdivisionName(countrySubdivisionName: string) {
		this.doc.countrySubdivisionName = countrySubdivisionName;
	}

	get postalCode(): string {
		return this.doc.postalCode || '';
	}

	set postalCode(postalCode: string) {
		this.doc.postalCode = postalCode;
	}

	get extendedPostalCode(): string {
		return this.doc.extendedPostalCode || '';
	}

	set extendedPostalCode(extendedPostalCode: string) {
		this.doc.extendedPostalCode = extendedPostalCode;
	}

	get countryCode(): string {
		return this.doc.countryCode || '';
	}

	set countryCode(countryCode: string) {
		this.doc.countryCode = countryCode;
	}

	get country(): string {
		return this.doc.country || '';
	}

	set country(country: string) {
		this.doc.country = country;
	}

	get countryCodeISO3(): string {
		return this.doc.countryCodeISO3 || '';
	}

	set countryCodeISO3(countryCodeISO3: string) {
		this.doc.countryCodeISO3 = countryCodeISO3;
	}

	get freeformAddress(): string {
		return this.doc.freeformAddress || '';
	}

	set freeformAddress(freeformAddress: string) {
		this.doc.freeformAddress = freeformAddress;
	}

	get streetNameAndNumber(): string {
		return this.doc.streetNameAndNumber || '';
	}

	set streetNameAndNumber(streetNameAndNumber: string) {
		this.doc.streetNameAndNumber = streetNameAndNumber;
	}

	get routeNumbers(): string {
		return this.doc.routeNumbers || '';
	}

	set routeNumbers(routeNumbers: string) {
		this.doc.routeNumbers = routeNumbers;
	}

	get crossStreet(): string {
		return this.doc.crossStreet || '';
	}

	set crossStreet(crossStreet: string) {
		this.doc.crossStreet = crossStreet;
	}
}

class PropertyLocationPositionDomainAdapter implements Domain.Contexts.Property.Property.PropertyLocationPositionProps {
	public readonly doc: Models.Property.Location['position'];
	constructor(doc: Models.Property.Location['position']) {
		this.doc = doc;
	}

	get type(): string | null {
		return this.doc.type || null;
	}

	set type(type: string | null) {
		this.doc.type = type || 'Point';
	}

	get coordinates(): ReadonlyArray<number> | null {
		return this.doc.coordinates || null;
	}

	set coordinates(coordinates: ReadonlyArray<number> | null) {
		this.doc.coordinates = coordinates as number[] | null;
	}
}

class PropertyListingDetailBedroomDetailDomainAdapter implements Domain.Contexts.Property.Property.PropertyListingDetailBedroomDetailProps {
	public readonly doc: Models.Property.BedroomDetail;
	constructor(doc: Models.Property.BedroomDetail) {
		this.doc = doc;
	}

	get id(): string {
		return this.doc.id?.valueOf() as string;
	}

	get roomName(): string {
		return this.doc.roomName || '';
	}

	set roomName(roomName: string) {
		this.doc.roomName = roomName;
	}

	get bedDescriptions(): string[] {
		return [...(this.doc.bedDescriptions || [])];
	}

	set bedDescriptions(bedDescriptions: string[]) {
		this.doc.bedDescriptions = bedDescriptions;
	}
}

class PropertyListingDetailAdditionalAmenityDomainAdapter implements Domain.Contexts.Property.Property.PropertyListingDetailAdditionalAmenityProps {
	public readonly doc: Models.Property.AdditionalAmenity;
	constructor(doc: Models.Property.AdditionalAmenity) {
		this.doc = doc;
	}

	get id(): string {
		return this.doc.id?.valueOf() as string;
	}

	get category(): string {
		return this.doc.category || '';
	}

	set category(category: string) {
		this.doc.category = category;
	}

	get amenities(): string[] {
		return [...(this.doc.amenities || [])];
	}

	set amenities(amenities: string[]) {
		this.doc.amenities = amenities;
	}
}

class PropertyListingDetailDomainAdapter implements Domain.Contexts.Property.Property.PropertyListingDetailProps {
	public readonly doc: Models.Property.ListingDetail;
	constructor(doc: Models.Property.ListingDetail) {
		this.doc = doc;
	}

	get price(): number | null {
		return this.doc.price || null;
	}

	set price(price: number | null) {
		this.doc.price = price;
	}

	get rentHigh(): number | null {
		return this.doc.rentHigh || null;
	}

	set rentHigh(rentHigh: number | null) {
		this.doc.rentHigh = rentHigh;
	}

	get rentLow(): number | null {
		return this.doc.rentLow || null;
	}

	set rentLow(rentLow: number | null) {
		this.doc.rentLow = rentLow;
	}

	get lease(): number | null {
		return this.doc.lease || null;
	}

	set lease(lease: number | null) {
		this.doc.lease = lease;
	}

	get maxGuests(): number | null {
		return this.doc.maxGuests || null;
	}

	set maxGuests(maxGuests: number | null) {
		this.doc.maxGuests = maxGuests;
	}

	get bedrooms(): number | null {
		return this.doc.bedrooms || null;
	}

	set bedrooms(bedrooms: number | null) {
		this.doc.bedrooms = bedrooms;
	}

	get bedroomDetails(): DomainSeedwork.PropArray<Domain.Contexts.Property.Property.PropertyListingDetailBedroomDetailProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.bedroomDetails, PropertyListingDetailBedroomDetailDomainAdapter);
	}

	get bathrooms(): number | null {
		return this.doc.bathrooms || null;
	}

	set bathrooms(bathrooms: number | null) {
		this.doc.bathrooms = bathrooms;
	}

	get squareFeet(): number | null {
		return this.doc.squareFeet || null;
	}

	set squareFeet(squareFeet: number | null) {
		this.doc.squareFeet = squareFeet;
	}

	get yearBuilt(): number | null {
		return this.doc.yearBuilt || null;
	}

	set yearBuilt(yearBuilt: number | null) {
		this.doc.yearBuilt = yearBuilt;
	}

	get lotSize(): number | null {
		return this.doc.lotSize || null;
	}

	set lotSize(lotSize: number | null) {
		this.doc.lotSize = lotSize;
	}

	get description(): string | null {
		return this.doc.description || null;
	}

	set description(description: string | null) {
		this.doc.description = description;
	}

	get amenities(): string[] {
		return [...(this.doc.amenities || [])];
	}

	set amenities(amenities: string[]) {
		this.doc.amenities = amenities;
	}

	get additionalAmenities(): DomainSeedwork.PropArray<Domain.Contexts.Property.Property.PropertyListingDetailAdditionalAmenityProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.additionalAmenities, PropertyListingDetailAdditionalAmenityDomainAdapter);
	}

	get images(): string[] {
		return [...(this.doc.images || [])];
	}

	set images(images: string[]) {
		this.doc.images = images;
	}

	get video(): string | null {
		return this.doc.video || null;
	}

	set video(video: string | null) {
		this.doc.video = video;
	}

	get floorPlan(): string | null {
		return this.doc.floorPlan || null;
	}

	set floorPlan(floorPlan: string | null) {
		this.doc.floorPlan = floorPlan;
	}

	get floorPlanImages(): string[] {
		return [...(this.doc.floorPlanImages || [])];
	}

	set floorPlanImages(floorPlanImages: string[]) {
		this.doc.floorPlanImages = floorPlanImages;
	}

	get listingAgent(): string | null {
		return this.doc.listingAgent || null;
	}

	set listingAgent(listingAgent: string | null) {
		this.doc.listingAgent = listingAgent;
	}

	get listingAgentPhone(): string | null {
		return this.doc.listingAgentPhone || null;
	}

	set listingAgentPhone(listingAgentPhone: string | null) {
		this.doc.listingAgentPhone = listingAgentPhone;
	}

	get listingAgentEmail(): string | null {
		return this.doc.listingAgentEmail || null;
	}

	set listingAgentEmail(listingAgentEmail: string | null) {
		this.doc.listingAgentEmail = listingAgentEmail;
	}

	get listingAgentWebsite(): string | null {
		return this.doc.listingAgentWebsite || null;
	}

	set listingAgentWebsite(listingAgentWebsite: string | null) {
		this.doc.listingAgentWebsite = listingAgentWebsite;
	}

	get listingAgentCompany(): string | null {
		return this.doc.listingAgentCompany || null;
	}

	set listingAgentCompany(listingAgentCompany: string | null) {
		this.doc.listingAgentCompany = listingAgentCompany;
	}

	get listingAgentCompanyPhone(): string | null {
		return this.doc.listingAgentCompanyPhone || null;
	}

	set listingAgentCompanyPhone(listingAgentCompanyPhone: string | null) {
		this.doc.listingAgentCompanyPhone = listingAgentCompanyPhone;
	}

	get listingAgentCompanyEmail(): string | null {
		return this.doc.listingAgentCompanyEmail || null;
	}

	set listingAgentCompanyEmail(listingAgentCompanyEmail: string | null) {
		this.doc.listingAgentCompanyEmail = listingAgentCompanyEmail;
	}

	get listingAgentCompanyWebsite(): string | null {
		return this.doc.listingAgentCompanyWebsite || null;
	}

	set listingAgentCompanyWebsite(listingAgentCompanyWebsite: string | null) {
		this.doc.listingAgentCompanyWebsite = listingAgentCompanyWebsite;
	}

	get listingAgentCompanyAddress(): string | null {
		return this.doc.listingAgentCompanyAddress || null;
	}

	set listingAgentCompanyAddress(listingAgentCompanyAddress: string | null) {
		this.doc.listingAgentCompanyAddress = listingAgentCompanyAddress;
	}
}