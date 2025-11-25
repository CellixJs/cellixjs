import { PermissionError, DomainEntity } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { PropertyVisa } from '../property.visa.ts';
import type * as ValueObjects from './property-listing-detail-additional-amenity.value-objects.ts';

export interface PropertyListingDetailAdditionalAmenityProps
	extends DomainEntityProps {
	category: string;
	amenities: string[];
}

export interface PropertyListingDetailAdditionalAmenityEntityReference
	extends Readonly<PropertyListingDetailAdditionalAmenityProps> {}

export class PropertyListingDetailAdditionalAmenity
	extends DomainEntity<PropertyListingDetailAdditionalAmenityProps>
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

    private validateVisa(): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageProperties ||
					(permissions.canEditOwnProperty && permissions.isEditingOwnProperty),
			)
		) {
			throw new PermissionError(
				'You do not have permission to update property amenities',
			);
		}
	}

	get category(): string {
		return this.props.category;
	}

	set category(category: ValueObjects.Category) {
		this.validateVisa();
		this.props.category = category.valueOf();
	}

	get amenities(): string[] {
		return [...this.props.amenities];
	}

	set amenities(amenities: ValueObjects.Amenities) {
		this.validateVisa();
		this.props.amenities = amenities.valueOf();
	}
}
