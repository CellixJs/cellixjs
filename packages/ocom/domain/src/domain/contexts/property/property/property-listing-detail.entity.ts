import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { PropertyVisa } from '../property.visa.ts';
import type * as ValueObjects from './property-listing-detail.value-objects.ts';
import {
	PropertyListingDetailAdditionalAmenity,
	type PropertyListingDetailAdditionalAmenityEntityReference,
	type PropertyListingDetailAdditionalAmenityProps,
} from './property-listing-detail-additional-amenity.entity.ts';
import {
	PropertyListingDetailBedroomDetail,
	type PropertyListingDetailBedroomDetailEntityReference,
	type PropertyListingDetailBedroomDetailProps,
} from './property-listing-detail-bedroom-detail.entity.ts';

export interface PropertyListingDetailProps extends ValueObjectProps {
	price: number | null;
	rentHigh: number | null;
	rentLow: number | null;
	lease: number | null;
	maxGuests: number | null;
	bedrooms: number | null;
	readonly bedroomDetails: PropArray<PropertyListingDetailBedroomDetailProps>;
	bathrooms: number | null;
	squareFeet: number | null;
	yearBuilt: number | null;
	lotSize: number | null;
	description: string | null;
	amenities: string[] | null;
	readonly additionalAmenities: PropArray<PropertyListingDetailAdditionalAmenityProps>;
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

export interface PropertyListingDetailEntityReference
	extends Readonly<
		Omit<PropertyListingDetailProps, 'bedroomDetails' | 'additionalAmenities'>
	> {
	readonly bedroomDetails: ReadonlyArray<PropertyListingDetailBedroomDetailEntityReference>;
	readonly additionalAmenities: ReadonlyArray<PropertyListingDetailAdditionalAmenityEntityReference>;
}

export class PropertyListingDetail
	extends ValueObject<PropertyListingDetailProps>
	implements PropertyListingDetailEntityReference
{
	private readonly visa: PropertyVisa;

	constructor(props: PropertyListingDetailProps, visa: PropertyVisa) {
		super(props);
		this.visa = visa;
	}

	get price(): number | null {
		return this.props.price;
	}
	set price(price: ValueObjects.Price) {
		this.ensureCanModifyListing();
		this.props.price = price.valueOf();
	}

	get rentHigh(): number | null {
		return this.props.rentHigh;
	}
	set rentHigh(value: ValueObjects.RentHigh) {
		this.ensureCanModifyListing();
		this.props.rentHigh = value.valueOf();
	}

	get rentLow(): number | null {
		return this.props.rentLow;
	}
	set rentLow(value: ValueObjects.RentLow) {
		this.ensureCanModifyListing();
		this.props.rentLow = value.valueOf();
	}

	get lease(): number | null {
		return this.props.lease;
	}
	set lease(value: ValueObjects.Lease) {
		this.ensureCanModifyListing();
		this.props.lease = value.valueOf();
	}

	get maxGuests(): number | null {
		return this.props.maxGuests;
	}
	set maxGuests(value: ValueObjects.MaxGuests) {
		this.ensureCanModifyListing();
		this.props.maxGuests = value.valueOf();
	}

	get bedrooms(): number | null {
		return this.props.bedrooms;
	}
	set bedrooms(value: ValueObjects.Bedrooms) {
		this.ensureCanModifyListing();
		this.props.bedrooms = value.valueOf();
	}

	get bedroomDetails(): ReadonlyArray<PropertyListingDetailBedroomDetail> {
		return this.props.bedroomDetails.items.map(
			(item) => new PropertyListingDetailBedroomDetail(item, this.visa),
		);
	}

	get bathrooms(): number | null {
		return this.props.bathrooms;
	}
	set bathrooms(value: ValueObjects.Bathrooms) {
		this.ensureCanModifyListing();
		this.props.bathrooms = value.valueOf();
	}

	get squareFeet(): number | null {
		return this.props.squareFeet;
	}
	set squareFeet(value: ValueObjects.SquareFeet) {
		this.ensureCanModifyListing();
		this.props.squareFeet = value.valueOf();
	}

	get yearBuilt(): number | null {
		return this.props.yearBuilt;
	}
	set yearBuilt(value: ValueObjects.YearBuilt) {
		this.ensureCanModifyListing();
		this.props.yearBuilt = value.valueOf();
	}

	get lotSize(): number | null {
		return this.props.lotSize;
	}
	set lotSize(value: ValueObjects.LotSize) {
		this.ensureCanModifyListing();
		this.props.lotSize = value.valueOf();
	}

	get description(): string | null {
		return this.props.description;
	}
	set description(value: ValueObjects.Description) {
		this.ensureCanModifyListing();
		this.props.description = value.valueOf();
	}

	get amenities(): string[] | null {
		return this.props.amenities;
	}
	set amenities(values: ValueObjects.Amenities) {
		this.ensureCanModifyListing();
		this.props.amenities = values.valueOf();
	}

	get additionalAmenities(): ReadonlyArray<PropertyListingDetailAdditionalAmenity> {
		return this.props.additionalAmenities.items.map(
			(item) => new PropertyListingDetailAdditionalAmenity(item, this.visa),
		);
	}

	get images(): string[] | null {
		return this.props.images;
	}
	set images(images: ValueObjects.Images) {
		this.ensureCanModifyListing();
		this.props.images = images.valueOf();
	}

	get video(): string | null {
		return this.props.video;
	}
	set video(value: ValueObjects.Video) {
		this.ensureCanModifyListing();
		this.props.video = value.valueOf();
	}

	get floorPlan(): string | null {
		return this.props.floorPlan;
	}
	set floorPlan(value: ValueObjects.FloorPlan) {
		this.ensureCanModifyListing();
		this.props.floorPlan = value.valueOf();
	}

	get floorPlanImages(): string[] | null {
		return this.props.floorPlanImages;
	}
	set floorPlanImages(images: ValueObjects.FloorPlanImages) {
		this.ensureCanModifyListing();
		this.props.floorPlanImages = images.valueOf();
	}

	get listingAgent(): string | null {
		return this.props.listingAgent;
	}
	set listingAgent(value: ValueObjects.ListingAgent) {
		this.ensureCanModifyListing();
		this.props.listingAgent = value.valueOf();
	}

	get listingAgentPhone(): string | null {
		return this.props.listingAgentPhone;
	}
	set listingAgentPhone(value: ValueObjects.ListingAgentPhone) {
		this.ensureCanModifyListing();
		this.props.listingAgentPhone = value.valueOf();
	}

	get listingAgentEmail(): string | null {
		return this.props.listingAgentEmail;
	}
	set listingAgentEmail(value: ValueObjects.ListingAgentEmail) {
		this.ensureCanModifyListing();
		this.props.listingAgentEmail = value.valueOf();
	}

	get listingAgentWebsite(): string | null {
		return this.props.listingAgentWebsite;
	}
	set listingAgentWebsite(value: ValueObjects.ListingAgentWebsite) {
		this.ensureCanModifyListing();
		this.props.listingAgentWebsite = value.valueOf();
	}

	get listingAgentCompany(): string | null {
		return this.props.listingAgentCompany;
	}
	set listingAgentCompany(value: ValueObjects.ListingAgentCompany) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompany = value.valueOf();
	}

	get listingAgentCompanyPhone(): string | null {
		return this.props.listingAgentCompanyPhone;
	}
	set listingAgentCompanyPhone(value: ValueObjects.ListingAgentCompanyPhone) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyPhone = value.valueOf();
	}

	get listingAgentCompanyEmail(): string | null {
		return this.props.listingAgentCompanyEmail;
	}
	set listingAgentCompanyEmail(value: ValueObjects.ListingAgentCompanyEmail) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyEmail = value.valueOf();
	}

	get listingAgentCompanyWebsite(): string | null {
		return this.props.listingAgentCompanyWebsite;
	}
	set listingAgentCompanyWebsite(value: ValueObjects.ListingAgentCompanyWebsite) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyWebsite = value.valueOf();
	}

	get listingAgentCompanyAddress(): string | null {
		return this.props.listingAgentCompanyAddress;
	}
	set listingAgentCompanyAddress(value: ValueObjects.ListingAgentCompanyAddress) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyAddress = value.valueOf();
	}

	public requestNewBedroom(): PropertyListingDetailBedroomDetail {
		this.ensureCanModifyListing();
		return new PropertyListingDetailBedroomDetail(
			this.props.bedroomDetails.getNewItem(),
			this.visa,
		);
	}

	public requestRemoveBedroom(
		detail: PropertyListingDetailBedroomDetailProps,
	): void {
		this.ensureCanModifyListing();
		this.props.bedroomDetails.removeItem(detail);
	}

	public requestNewAdditionalAmenity(): PropertyListingDetailAdditionalAmenity {
		this.ensureCanModifyListing();
		return new PropertyListingDetailAdditionalAmenity(
			this.props.additionalAmenities.getNewItem(),
			this.visa,
		);
	}

	public requestRemoveAdditionalAmenity(
		amenity: PropertyListingDetailAdditionalAmenityProps,
	): void {
		this.ensureCanModifyListing();
		this.props.additionalAmenities.removeItem(amenity);
	}

	public requestRemoveImage(blobName: string): void {
		this.ensureCanModifyListing();
		this.props.images =
			this.props.images?.filter((image) => image !== blobName) || null;
		this.props.floorPlanImages =
			this.props.floorPlanImages?.filter((image) => image !== blobName) || null;
	}

	private ensureCanModifyListing(): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageProperties ||
					(permissions.canEditOwnProperty && permissions.isEditingOwnProperty),
			)
		) {
			throw new PermissionError(
				'You do not have permission to update this property listing',
			);
		}
	}
}
