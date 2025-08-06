import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityVisa } from '../community.visa.ts';
import { CommunityCreatedEvent } from '../../../events/types/community-created.ts';
import { CommunityDomainUpdatedEvent } from '../../../events/types/community-domain-updated.ts';
import {
	EndUser,
	type EndUserEntityReference,
} from '../../user/end-user/end-user.ts';
import * as ValueObjects from './community.value-objects.ts';
import type { Passport } from '../../passport.ts';
import type { Domain } from '../../../../index.ts';

export interface CommunityProps extends DomainSeedwork.DomainEntityProps {
	name: string;
	domain: string;
	whiteLabelDomain: string | null;
	handle: string | null;
	createdBy: Readonly<EndUserEntityReference>;

	get createdAt(): Date;
	get updatedAt(): Date;
	get schemaVersion(): string;
}

export interface CommunityEntityReference extends Readonly<CommunityProps> {}

export class Community<props extends CommunityProps>
	extends DomainSeedwork.AggregateRoot<props, Passport>
	implements CommunityEntityReference
{
	//#region Fields
	private isNew: boolean = false;
	private readonly visa: CommunityVisa;

	//#endregion Fields

	//#region Constructors
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.community.forCommunity(this);
	}
	//#endregion Constructors

	//#region Methods
	public static getNewInstance<props extends CommunityProps>(
		newProps: props,
		communityName: string,
		createdByUser: EndUserEntityReference,
		passport: Passport,
	): Community<props> {
		const newInstance = new Community(newProps, passport);
		newInstance.markAsNew();
		newInstance.name = communityName;
		newInstance.createdBy = createdByUser;
		newInstance.isNew = false;
		return newInstance;
	}

	private markAsNew(): void {
		this.isNew = true;
		this.addIntegrationEvent(CommunityCreatedEvent, {
			communityId: this.props.id,
		});
	}
	//#endregion Methods

	//#region Properties
	get name(): string {
		return this.props.name;
	}
	set name(name: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) => domainPermissions.canManageCommunitySettings,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the name of this community',
			);
		}
		this.props.name = new ValueObjects.Name(name).valueOf();
	}

	get domain(): string {
		return this.props.domain;
	}
	set domain(domain: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) => domainPermissions.canManageCommunitySettings,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the domain of this community',
			);
		}
		const oldDomain = this.props.domain;
		if (this.props.domain !== domain) {
			this.props.domain = new ValueObjects.Domain(domain).valueOf();
			this.addIntegrationEvent(CommunityDomainUpdatedEvent, {
				communityId: this.props.id,
				domain,
				oldDomain: oldDomain,
			});
		}
	}

	get whiteLabelDomain(): string | null {
		return this.props.whiteLabelDomain;
	}
	set whiteLabelDomain(whiteLabelDomain: string | null) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) => domainPermissions.canManageCommunitySettings,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the white label domain of this community',
			);
		}
		this.props.whiteLabelDomain = new ValueObjects.WhiteLabelDomain(whiteLabelDomain).valueOf();
	}

	get handle(): string | null {
		return this.props.handle;
	}
	set handle(handle: string | null) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) => domainPermissions.canManageCommunitySettings,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the handle of this community',
			);
		}
		this.props.handle = new ValueObjects.Handle(handle).valueOf();
	}

	get createdBy(): EndUserEntityReference {
		return new EndUser(this.props.createdBy, this.passport);
	}
	private set createdBy(createdBy: EndUserEntityReference | null | undefined) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) => domainPermissions.canManageCommunitySettings,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to change the created by of this community',
			);
		}
		if (createdBy === null || createdBy === undefined) {
			throw new DomainSeedwork.PermissionError(
				'createdBy cannot be null or undefined',
			);
		}
		this.props.createdBy = createdBy;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
	//#endregion Properties
}
