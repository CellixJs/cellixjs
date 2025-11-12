import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { PropertyVisa } from '../property.visa.ts';
import type * as ValueObjects from './property-listing-detail-additional-amenity.value-objects.ts';

export interface PropertyListingDetailAdditionalAmenityProps
	extends DomainSeedwork.DomainEntityProps {
	category: string;
	amenities: string[];
}

export interface PropertyListingDetailAdditionalAmenityEntityReference
	extends Readonly<PropertyListingDetailAdditionalAmenityProps> {}

export class PropertyListingDetailAdditionalAmenity
	extends DomainSeedwork.DomainEntity<PropertyListingDetailAdditionalAmenityProps>
	implements PropertyListingDetailAdditionalAmenityEntityReference
{
	private readonly visa: PropertyVisa;

	constructor(
		props: PropertyListingDetailAdditionalAmenityProps,
		visa: PropertyVisa,
	) {
		super(props);
		this.visa = visa;
	}

	get category(): string {
		return this.props.category;
	}

	set category(category: ValueObjects.Category) {
		this.ensureCanModify();
		this.props.category = category.valueOf();
	}

	get amenities(): string[] {
		return [...this.props.amenities];
	}

	set amenities(amenities: ValueObjects.Amenities) {
		this.ensureCanModify();
		this.props.amenities = amenities.valueOf();
	}

	private ensureCanModify(): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageProperties ||
					(permissions.canEditOwnProperty && permissions.isEditingOwnProperty),
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update property amenities',
			);
		}
	}
}
