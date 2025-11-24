import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { PropertyVisa } from '../property.visa.ts';
import {
	PropertyLocationAddress,
	type PropertyLocationAddressEntityReference,
	type PropertyLocationAddressProps,
} from './property-location-address.entity.ts';
import {
	PropertyLocationPosition,
	type PropertyLocationPositionEntityReference,
	type PropertyLocationPositionProps,
} from './property-location-position.entity.ts';

export interface PropertyLocationProps extends ValueObjectProps {
	address: PropertyLocationAddressProps;
	position: PropertyLocationPositionProps;
}

export interface PropertyLocationEntityReference
	extends Readonly<Omit<PropertyLocationProps, 'address' | 'position'>> {
	readonly address: PropertyLocationAddressEntityReference;
	readonly position: PropertyLocationPositionEntityReference;
}

export class PropertyLocation
	extends ValueObject<PropertyLocationProps>
	implements PropertyLocationEntityReference
{
	private readonly visa: PropertyVisa;

	constructor(props: PropertyLocationProps, visa: PropertyVisa) {
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
				'You do not have permission to update this property location',
			);
		}
	}

	get address(): PropertyLocationAddressEntityReference {
		return new PropertyLocationAddress(this.props.address);
	}

	set address(address: PropertyLocationAddressProps) {
		this.validateVisa();

		this.props.address.country = address.country;
		this.props.address.countryCode = address.countryCode;
		this.props.address.countryCodeISO3 = address.countryCodeISO3;
		this.props.address.countrySubdivision = address.countrySubdivision;
		this.props.address.countrySubdivisionName = address.countrySubdivisionName;
		this.props.address.countryTertiarySubdivision =
			address.countryTertiarySubdivision;
		this.props.address.countrySecondarySubdivision =
			address.countrySecondarySubdivision;
		this.props.address.municipality = address.municipality;
		this.props.address.municipalitySubdivision =
			address.municipalitySubdivision;
		this.props.address.localName = address.localName;
		this.props.address.postalCode = address.postalCode;
		this.props.address.extendedPostalCode = address.extendedPostalCode;
		this.props.address.streetName = address.streetName;
		this.props.address.streetNumber = address.streetNumber;
		this.props.address.freeformAddress = address.freeformAddress;
		this.props.address.streetNameAndNumber = address.streetNameAndNumber;
		this.props.address.routeNumbers = address.routeNumbers;
		this.props.address.crossStreet = address.crossStreet;
	}

	get position(): PropertyLocationPositionEntityReference {
		return new PropertyLocationPosition(this.props.position);
	}

	set position(position: PropertyLocationPositionProps) {
		this.validateVisa();
		this.props.position.type = position.type;
		this.props.position.coordinates = position.coordinates
			? [...position.coordinates]
			: null;
	}
}
