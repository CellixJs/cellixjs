import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { PropertyVisa } from '../property.visa.ts';
import {
	PropertyListingDetailAdditionalAmenity,
	type PropertyListingDetailAdditionalAmenityEntityReference,
	type PropertyListingDetailAdditionalAmenityProps,
} from './property-listing-detail-additional-amenity.ts';
import {
	PropertyListingDetailBedroomDetail,
	type PropertyListingDetailBedroomDetailEntityReference,
	type PropertyListingDetailBedroomDetailProps,
} from './property-listing-detail-bedroom-detail.ts';

export interface PropertyListingDetailProps
	extends DomainSeedwork.ValueObjectProps {
	price: number | null;
	rentHigh: number | null;
	rentLow: number | null;
	lease: number | null;
	maxGuests: number | null;
	bedrooms: number | null;
	readonly bedroomDetails: DomainSeedwork.PropArray<PropertyListingDetailBedroomDetailProps>;
	bathrooms: number | null;
	squareFeet: number | null;
	yearBuilt: number | null;
	lotSize: number | null;
	description: string | null;
	amenities: string[];
	readonly additionalAmenities: DomainSeedwork.PropArray<PropertyListingDetailAdditionalAmenityProps>;
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

export interface PropertyListingDetailEntityReference
	extends Readonly<
	Omit<
		PropertyListingDetailProps,
		'bedroomDetails' | 'additionalAmenities'
	>
> {
	readonly bedroomDetails: ReadonlyArray<PropertyListingDetailBedroomDetailEntityReference>;
	readonly additionalAmenities: ReadonlyArray<PropertyListingDetailAdditionalAmenityEntityReference>;
}

export class PropertyListingDetail
	extends DomainSeedwork.ValueObject<PropertyListingDetailProps>
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
	set price(price: number | null) {
		this.ensureCanModifyListing();
		this.props.price = this.normalizeNullableNumber(price);
	}

	get rentHigh(): number | null {
		return this.props.rentHigh;
	}
	set rentHigh(value: number | null) {
		this.ensureCanModifyListing();
		this.props.rentHigh = this.normalizeNullableNumber(value);
	}

	get rentLow(): number | null {
		return this.props.rentLow;
	}
	set rentLow(value: number | null) {
		this.ensureCanModifyListing();
		this.props.rentLow = this.normalizeNullableNumber(value);
	}

	get lease(): number | null {
		return this.props.lease;
	}
	set lease(value: number | null) {
		this.ensureCanModifyListing();
		this.props.lease = this.normalizeNullableNumber(value);
	}

	get maxGuests(): number | null {
		return this.props.maxGuests;
	}
	set maxGuests(value: number | null) {
		this.ensureCanModifyListing();
		this.props.maxGuests = this.normalizeNullableWholeNumber(value);
	}

	get bedrooms(): number | null {
		return this.props.bedrooms;
	}
	set bedrooms(value: number | null) {
		this.ensureCanModifyListing();
		this.props.bedrooms = this.normalizeNullableWholeNumber(value);
	}

	get bedroomDetails(): ReadonlyArray<PropertyListingDetailBedroomDetail> {
		return this.props.bedroomDetails.items.map(
			(item) => new PropertyListingDetailBedroomDetail(item, this.visa),
		);
	}

	get bathrooms(): number | null {
		return this.props.bathrooms;
	}
	set bathrooms(value: number | null) {
		this.ensureCanModifyListing();
		this.props.bathrooms = this.normalizeNullableNumber(value);
	}

	get squareFeet(): number | null {
		return this.props.squareFeet;
	}
	set squareFeet(value: number | null) {
		this.ensureCanModifyListing();
		this.props.squareFeet = this.normalizeNullableWholeNumber(value);
	}

	get yearBuilt(): number | null {
		return this.props.yearBuilt;
	}
	set yearBuilt(value: number | null) {
		this.ensureCanModifyListing();
		this.props.yearBuilt = this.normalizeNullableWholeNumber(value);
	}

	get lotSize(): number | null {
		return this.props.lotSize;
	}
	set lotSize(value: number | null) {
		this.ensureCanModifyListing();
		this.props.lotSize = this.normalizeNullableWholeNumber(value);
	}

	get description(): string | null {
		return this.props.description;
	}
	set description(value: string | null) {
		this.ensureCanModifyListing();
		this.props.description = this.normalizeNullableString(value, 5000);
	}

	get amenities(): string[] {
		return [...this.props.amenities];
	}
	set amenities(values: string[]) {
		this.ensureCanModifyListing();
		this.props.amenities = this.normalizeStringArray(values, 50, 100);
	}

	get additionalAmenities(): ReadonlyArray<PropertyListingDetailAdditionalAmenity> {
		return this.props.additionalAmenities.items.map(
			(item) => new PropertyListingDetailAdditionalAmenity(item, this.visa),
		);
	}

	get images(): string[] {
		return [...this.props.images];
	}
	set images(images: string[]) {
		this.ensureCanModifyListing();
		this.props.images = this.normalizeStringArray(images, 50, 2048);
	}

	get video(): string | null {
		return this.props.video;
	}
	set video(value: string | null) {
		this.ensureCanModifyListing();
		this.props.video = this.normalizeNullableString(value, 2048);
	}

	get floorPlan(): string | null {
		return this.props.floorPlan;
	}
	set floorPlan(value: string | null) {
		this.ensureCanModifyListing();
		this.props.floorPlan = this.normalizeNullableString(value, 2048);
	}

	get floorPlanImages(): string[] {
		return [...this.props.floorPlanImages];
	}
	set floorPlanImages(images: string[]) {
		this.ensureCanModifyListing();
		this.props.floorPlanImages = this.normalizeStringArray(images, 50, 2048);
	}

	get listingAgent(): string | null {
		return this.props.listingAgent;
	}
	set listingAgent(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgent = this.normalizeNullableString(value, 500);
	}

	get listingAgentPhone(): string | null {
		return this.props.listingAgentPhone;
	}
	set listingAgentPhone(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentPhone = this.normalizeNullableString(value, 100);
	}

	get listingAgentEmail(): string | null {
		return this.props.listingAgentEmail;
	}
	set listingAgentEmail(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentEmail = this.normalizeNullableString(value, 320);
	}

	get listingAgentWebsite(): string | null {
		return this.props.listingAgentWebsite;
	}
	set listingAgentWebsite(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentWebsite = this.normalizeNullableString(value, 1000);
	}

	get listingAgentCompany(): string | null {
		return this.props.listingAgentCompany;
	}
	set listingAgentCompany(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompany = this.normalizeNullableString(value, 500);
	}

	get listingAgentCompanyPhone(): string | null {
		return this.props.listingAgentCompanyPhone;
	}
	set listingAgentCompanyPhone(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyPhone = this.normalizeNullableString(value, 100);
	}

	get listingAgentCompanyEmail(): string | null {
		return this.props.listingAgentCompanyEmail;
	}
	set listingAgentCompanyEmail(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyEmail = this.normalizeNullableString(value, 320);
	}

	get listingAgentCompanyWebsite(): string | null {
		return this.props.listingAgentCompanyWebsite;
	}
	set listingAgentCompanyWebsite(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyWebsite = this.normalizeNullableString(value, 1000);
	}

	get listingAgentCompanyAddress(): string | null {
		return this.props.listingAgentCompanyAddress;
	}
	set listingAgentCompanyAddress(value: string | null) {
		this.ensureCanModifyListing();
		this.props.listingAgentCompanyAddress = this.normalizeNullableString(value, 1000);
	}

	public requestNewBedroom(): PropertyListingDetailBedroomDetail {
		this.ensureCanModifyListing();
		return new PropertyListingDetailBedroomDetail(
			this.props.bedroomDetails.getNewItem(),
			this.visa,
		);
	}

	public requestRemoveBedroom(detail: PropertyListingDetailBedroomDetailProps): void {
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
		this.props.images = this.props.images.filter((image) => image !== blobName);
		this.props.floorPlanImages = this.props.floorPlanImages.filter(
			(image) => image !== blobName,
		);
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
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this property listing',
			);
		}
	}

	private normalizeNullableNumber(value: number | null): number | null {
		if (value === null || value === undefined) {
			return null;
		}
		return Number.isFinite(value) ? value : null;
	}

	private normalizeNullableWholeNumber(value: number | null): number | null {
		const normalised = this.normalizeNullableNumber(value);
		return normalised === null ? null : Math.trunc(normalised);
	}

	private normalizeNullableString(value: string | null, maxLength: number): string | null {
		if (value === null || value === undefined) {
			return null;
		}
		const trimmed = value.trim();
		return trimmed.slice(0, maxLength);
	}

	private normalizeStringArray(
		values: string[],
		maxItems: number,
		maxLength: number,
	): string[] {
		return values
			.slice(0, maxItems)
			.map((item) => item.trim().slice(0, maxLength))
			.filter((item) => item.length > 0);
	}
}
