import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { PropertyVisa } from '../property.visa.ts';
import {
	PropertyLocationAddress,
	type PropertyLocationAddressEntityReference,
	type PropertyLocationAddressProps,
} from './property-location-address.ts';
import {
	PropertyLocationPosition,
	type PropertyLocationPositionEntityReference,
	type PropertyLocationPositionProps,
} from './property-location-position.ts';

export interface PropertyLocationProps extends DomainSeedwork.ValueObjectProps {
	address: PropertyLocationAddressProps;
	position: PropertyLocationPositionProps;
}

export interface PropertyLocationEntityReference
	extends Readonly<Omit<PropertyLocationProps, 'address' | 'position'>> {
	readonly address: PropertyLocationAddressEntityReference;
	readonly position: PropertyLocationPositionEntityReference;
}

export class PropertyLocation
	extends DomainSeedwork.ValueObject<PropertyLocationProps>
	implements PropertyLocationEntityReference
{
	private readonly visa: PropertyVisa;

	constructor(props: PropertyLocationProps, visa: PropertyVisa) {
		super(props);
		this.visa = visa;
	}

	get address(): PropertyLocationAddressEntityReference {
		return new PropertyLocationAddress(this.props.address);
	}

	set address(address: PropertyLocationAddressProps) {
		this.ensureCanModify();
		this.props.address = { ...address };
	}

	get position(): PropertyLocationPositionEntityReference {
		return new PropertyLocationPosition(this.props.position);
	}

	set position(position: PropertyLocationPositionProps) {
		this.ensureCanModify();
		this.props.position = {
			type: position.type,
			coordinates: position.coordinates ? [...position.coordinates] : null,
		};
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
				'You do not have permission to update this property location',
			);
		}
	}
}
