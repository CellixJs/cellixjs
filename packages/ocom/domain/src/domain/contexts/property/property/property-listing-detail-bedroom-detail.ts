import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { PropertyVisa } from '../property.visa.ts';

export interface PropertyListingDetailBedroomDetailProps
	extends DomainSeedwork.DomainEntityProps {
	roomName: string;
	bedDescriptions: string[];
}

export interface PropertyListingDetailBedroomDetailEntityReference
	extends Readonly<PropertyListingDetailBedroomDetailProps> {}

export class PropertyListingDetailBedroomDetail
	extends DomainSeedwork.DomainEntity<PropertyListingDetailBedroomDetailProps>
	implements PropertyListingDetailBedroomDetailEntityReference
{
	private readonly visa: PropertyVisa;

	constructor(props: PropertyListingDetailBedroomDetailProps, visa: PropertyVisa) {
		super(props);
		this.visa = visa;
	}

	get roomName(): string {
		return this.props.roomName;
	}

	set roomName(roomName: string) {
		this.ensureCanModify();
		this.props.roomName = roomName.trim();
	}

	get bedDescriptions(): string[] {
		return [...this.props.bedDescriptions];
	}

	set bedDescriptions(descriptions: string[]) {
		this.ensureCanModify();
		this.props.bedDescriptions = descriptions.map((item) => item.trim());
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
				'You do not have permission to update bedroom details for this property',
			);
		}
	}
}
