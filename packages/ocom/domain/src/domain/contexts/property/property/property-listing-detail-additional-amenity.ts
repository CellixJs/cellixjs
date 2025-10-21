import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { PropertyVisa } from '../property.visa.ts';

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

	constructor(props: PropertyListingDetailAdditionalAmenityProps, visa: PropertyVisa) {
		super(props);
		this.visa = visa;
	}

	get category(): string {
		return this.props.category;
	}

	set category(category: string) {
		this.ensureCanModify();
		this.props.category = category.trim();
	}

	get amenities(): string[] {
		return [...this.props.amenities];
	}

	set amenities(amenities: string[]) {
		this.ensureCanModify();
		this.props.amenities = amenities.map((item) => item.trim());
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
