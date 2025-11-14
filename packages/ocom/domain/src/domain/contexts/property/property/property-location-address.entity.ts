import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
export interface PropertyLocationAddressProps extends ValueObjectProps {
	streetNumber: string;
	streetName: string;
	municipality: string;
	municipalitySubdivision: string;
	localName: string;
	countrySecondarySubdivision: string;
	countryTertiarySubdivision: string;
	countrySubdivision: string;
	countrySubdivisionName: string;
	postalCode: string;
	extendedPostalCode: string;
	countryCode: string;
	country: string;
	countryCodeISO3: string;
	freeformAddress: string;
	streetNameAndNumber: string;
	routeNumbers: string;
	crossStreet: string;
}

export interface PropertyLocationAddressEntityReference
	extends Readonly<PropertyLocationAddressProps> {}

export class PropertyLocationAddress
	extends ValueObject<PropertyLocationAddressProps>
	implements PropertyLocationAddressEntityReference
{
	get streetNumber(): string {
		return this.props.streetNumber;
	}
	get streetName(): string {
		return this.props.streetName;
	}
	get municipality(): string {
		return this.props.municipality;
	}
	get municipalitySubdivision(): string {
		return this.props.municipalitySubdivision;
	}
	get localName(): string {
		return this.props.localName;
	}
	get countrySecondarySubdivision(): string {
		return this.props.countrySecondarySubdivision;
	}
	get countryTertiarySubdivision(): string {
		return this.props.countryTertiarySubdivision;
	}
	get countrySubdivision(): string {
		return this.props.countrySubdivision;
	}
	get countrySubdivisionName(): string {
		return this.props.countrySubdivisionName;
	}
	get postalCode(): string {
		return this.props.postalCode;
	}
	get extendedPostalCode(): string {
		return this.props.extendedPostalCode;
	}
	get countryCode(): string {
		return this.props.countryCode;
	}
	get country(): string {
		return this.props.country;
	}
	get countryCodeISO3(): string {
		return this.props.countryCodeISO3;
	}
	get freeformAddress(): string {
		return this.props.freeformAddress;
	}
	get streetNameAndNumber(): string {
		return this.props.streetNameAndNumber;
	}
	get routeNumbers(): string {
		return this.props.routeNumbers;
	}
	get crossStreet(): string {
		return this.props.crossStreet;
	}
}
