import { PermissionError, DomainEntity } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { PropertyVisa } from '../property.visa.ts';
import type * as ValueObjects from './property-listing-detail-bedroom-detail.value-objects.ts';

export interface PropertyListingDetailBedroomDetailProps
	extends DomainEntityProps {
	roomName: string;
	bedDescriptions: string[];
}

export interface PropertyListingDetailBedroomDetailEntityReference
	extends Readonly<PropertyListingDetailBedroomDetailProps> {}

export class PropertyListingDetailBedroomDetail
	extends DomainEntity<PropertyListingDetailBedroomDetailProps>
	implements PropertyListingDetailBedroomDetailEntityReference
{
	private readonly visa: PropertyVisa;

	constructor(
		props: PropertyListingDetailBedroomDetailProps,
		visa: PropertyVisa,
	) {
		super(props);
		this.visa = visa;
	}

	get roomName(): string {
		return this.props.roomName;
	}

	set roomName(roomName: ValueObjects.RoomName) {
		this.ensureCanModify();
		this.props.roomName = roomName.valueOf();
	}

	get bedDescriptions(): string[] {
		return [...this.props.bedDescriptions];
	}

	set bedDescriptions(descriptions: ValueObjects.BedDescriptions) {
		this.ensureCanModify();
		this.props.bedDescriptions = descriptions.valueOf();
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
			throw new PermissionError(
				'You do not have permission to update bedroom details for this property',
			);
		}
	}
}
