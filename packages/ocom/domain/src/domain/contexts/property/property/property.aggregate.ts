import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import {
	PropertyCreatedEvent,
	type PropertyCreatedProps,
} from '../../../events/types/property-created.ts';
import {
	PropertyDeletedEvent,
	type PropertyDeletedEventProps,
} from '../../../events/types/property-deleted.ts';
import {
	PropertyUpdatedEvent,
	type PropertyUpdatedProps,
} from '../../../events/types/property-updated.ts';
import {
	Community,
	type CommunityEntityReference,
	type CommunityProps,
} from '../../community/community/community.ts';
import type { MemberEntityReference } from '../../community/member/member.ts';
import type { Passport } from '../../passport.ts';
import type { PropertyVisa } from '../property.visa.ts';
import * as ValueObjects from './property.value-objects.ts';
import {
	PropertyListingDetail,
	type PropertyListingDetailEntityReference,
	type PropertyListingDetailProps,
} from './property-listing-detail.entity.ts';
import {
	PropertyLocation,
	type PropertyLocationEntityReference,
	type PropertyLocationProps,
} from './property-location.entity.ts';

export interface PropertyProps extends DomainEntityProps {
	community: CommunityProps;
	location: PropertyLocationProps;
	owner: Readonly<MemberEntityReference> | null;
	propertyName: string;
	propertyType: string;
	listedForSale: boolean;
	listedForRent: boolean;
	listedForLease: boolean;
	listedInDirectory: boolean;
	listingDetail: PropertyListingDetailProps;
	tags: string[];
	hash: string | null;
	lastIndexed: Date | null;
	updateIndexFailedDate: Date | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface PropertyEntityReference
	extends Readonly<
		Omit<
			PropertyProps,
			| 'community'
			| 'setCommunityRef'
			| 'location'
			| 'owner'
			| 'setOwnerRef'
			| 'listingDetail'
		>
	> {
	readonly community: CommunityEntityReference;
	readonly location: PropertyLocationEntityReference;
	readonly owner: MemberEntityReference | null;
	readonly listingDetail: PropertyListingDetailEntityReference;
}

export class Property<props extends PropertyProps>
	extends AggregateRoot<props, Passport>
	implements PropertyEntityReference
{
	private isNew: boolean = false;
	private visaCache: PropertyVisa | undefined;

	public static getNewInstance<props extends PropertyProps>(
		newProps: props,
		propertyName: string,
		community: CommunityEntityReference,
		passport: Passport,
	): Property<props> {
		const property = new Property(newProps, passport);
		property.isNew = true;
		property.propertyName = propertyName;
		property.community = community;
		property.listedForSale = false;
		property.listedForRent = false;
		property.listedForLease = false;
		property.listedInDirectory = false;
		property.addIntegrationEvent<PropertyCreatedProps, PropertyCreatedEvent>(
			PropertyCreatedEvent,
			{
				id: property.props.id,
			},
		);
		property.isNew = false;
		return property;
	}

    	public requestDelete(): void {
		this.ensureCanManage('You do not have permission to delete this property');
		if (!this.isDeleted) {
			this.isDeleted = true;
			this.addIntegrationEvent<PropertyDeletedEventProps, PropertyDeletedEvent>(
				PropertyDeletedEvent,
				{ id: this.props.id },
			);
		}
	}

	public override onSave(isModified: boolean): void {
		super.onSave(isModified);
		if (isModified && !this.isDeleted) {
			this.addIntegrationEvent<PropertyUpdatedProps, PropertyUpdatedEvent>(
				PropertyUpdatedEvent,
				{ id: this.props.id },
			);
		}
	}

	private ensureCanManage(message: string): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount || permissions.canManageProperties,
			)
		) {
			throw new PermissionError(message);
		}
	}

	private ensureCanManageOrEditOwn(message: string): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageProperties ||
					(permissions.canEditOwnProperty && permissions.isEditingOwnProperty),
			)
		) {
			throw new PermissionError(message);
		}
	}

	private normalizeTags(tags: string[]): string[] {
		return tags
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0)
			.slice(0, 50);
	}

	private get visa(): PropertyVisa {
		const visa = this.visaCache ?? this.passport.property.forProperty(this);
		this.visaCache = visa;
		return visa;
	}

	get community(): CommunityEntityReference {
		return new Community(this.props.community, this.passport);
	}

	private set community(value: CommunityEntityReference) {
		if (!this.isNew) {
			this.ensureCanManage(
				"You do not have permission to update this property's community",
			);
		}
		this.props.community = value;
	}

	get location(): PropertyLocationEntityReference {
		return new PropertyLocation(this.props.location, this.visa);
	}

	set location(value: PropertyLocationProps) {
		this.ensureCanManageOrEditOwn(
			"You do not have permission to update this property's location",
		);
		this.props.location = {
			address: { ...value.address },
			position: {
				type: value.position.type,
				coordinates: value.position.coordinates
					? [...value.position.coordinates]
					: null,
			},
		};
	}

	get owner(): MemberEntityReference | null {
		return this.props.owner;
	}

	set owner(owner: MemberEntityReference | null) {
		if (!this.isNew) {
			this.ensureCanManage(
				"You do not have permission to update this property's owner",
			);
		}
		this.props.owner = owner;
	}

	get propertyName(): string {
		return this.props.propertyName;
	}

	set propertyName(propertyName: string) {
		if (!this.isNew) {
			this.ensureCanManage(
				"You do not have permission to update this property's name",
			);
		}
		this.props.propertyName = new ValueObjects.PropertyName(
			propertyName,
		).valueOf();
	}

	get propertyType(): string {
		return this.props.propertyType;
	}

	set propertyType(propertyType: string) {
		this.ensureCanManage(
			"You do not have permission to update this property's type",
		);
		this.props.propertyType = new ValueObjects.PropertyType(
			propertyType,
		).valueOf();
	}

	get listedForSale(): boolean {
		return this.props.listedForSale;
	}

	set listedForSale(listed: boolean) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the sale status of this property',
		);
		this.props.listedForSale = listed;
	}

	get listedForRent(): boolean {
		return this.props.listedForRent;
	}

	set listedForRent(listed: boolean) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the rental status of this property',
		);
		this.props.listedForRent = listed;
	}

	get listedForLease(): boolean {
		return this.props.listedForLease;
	}

	set listedForLease(listed: boolean) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the lease status of this property',
		);
		this.props.listedForLease = listed;
	}

	get listedInDirectory(): boolean {
		return this.props.listedInDirectory;
	}

	set listedInDirectory(listed: boolean) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the directory visibility for this property',
		);
		this.props.listedInDirectory = listed;
	}

	get listingDetail(): PropertyListingDetailEntityReference {
		return new PropertyListingDetail(this.props.listingDetail, this.visa);
	}

	get tags(): string[] {
		return [...this.props.tags];
	}

	set tags(tags: string[]) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the tags for this property',
		);
		this.props.tags = this.normalizeTags(tags);
	}

	get hash(): string | null {
		return this.props.hash;
	}

	set hash(hash: string | null) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the index hash for this property',
		);
		this.props.hash = hash;
	}

	get lastIndexed(): Date | null {
		return this.props.lastIndexed;
	}

	set lastIndexed(lastIndexed: Date | null) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the index timestamp for this property',
		);
		this.props.lastIndexed = lastIndexed;
	}

	get updateIndexFailedDate(): Date | null {
		return this.props.updateIndexFailedDate;
	}

	set updateIndexFailedDate(updateIndexFailedDate: Date | null) {
		this.ensureCanManageOrEditOwn(
			'You do not have permission to update the failed index timestamp for this property',
		);
		this.props.updateIndexFailedDate = updateIndexFailedDate;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}
