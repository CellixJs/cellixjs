import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { CommunityCreatedEvent, type CommunityCreatedProps } from '../../../events/types/community-created.ts';
import { CommunityDomainUpdatedEvent, type CommunityDomainUpdatedProps } from '../../../events/types/community-domain-updated.ts';
import { CommunityWhiteLabelDomainUpdatedEvent, type CommunityWhiteLabelDomainUpdatedProps } from '../../../events/types/community-white-label-domain-updated.ts';
import type { Passport } from '../../passport.ts';
import { EndUser, type EndUserEntityReference } from '../../user/end-user/end-user.ts';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './community.value-objects.ts';
import { CommunityFinance, type CommunityFinanceProps } from './community-finance.ts';
import type { CommunityTransaction } from './community-transaction.ts';

export interface CommunityProps extends DomainEntityProps {
	name: string;
	domain: string;
	whiteLabelDomain: string | null;
	handle: string | null;
	createdBy: Readonly<EndUserEntityReference>;
	loadCreatedBy: () => Promise<EndUserEntityReference>;
	readonly finance: CommunityFinanceProps;

	get createdAt(): Date;
	get updatedAt(): Date;
	get schemaVersion(): string;
}

export interface CommunityEntityReference extends Readonly<CommunityProps> {}

export class Community<props extends CommunityProps> extends AggregateRoot<props, Passport> implements CommunityEntityReference {
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
	public static getNewInstance<props extends CommunityProps>(newProps: props, communityName: string, createdByUser: EndUserEntityReference, passport: Passport): Community<props> {
		const newInstance = new Community(newProps, passport);
		newInstance.markAsNew();
		newInstance.name = communityName;
		newInstance.createdBy = createdByUser;
		// Every community must carry a tier: pricing lookups key off it, and a community
		// without one fails at the first subscription charge.
		newInstance.finance.subscriptionTier = ValueObjects.SubscriptionTiers.Pro;
		newInstance.isNew = false;
		return newInstance;
	}

	public requestNewTransaction(): CommunityTransaction {
		return new CommunityFinance(this.props.finance, this.visa, this.isNew).requestNewTransaction();
	}

	private markAsNew(): void {
		this.isNew = true;
		this.addIntegrationEvent<CommunityCreatedProps, CommunityCreatedEvent>(CommunityCreatedEvent, {
			communityId: this.props.id,
		});
	}

	async loadCreatedBy(): Promise<EndUserEntityReference> {
		return await this.props.loadCreatedBy();
	}
	//#endregion Methods

	//#region Properties
	get name(): string {
		return this.props.name;
	}
	set name(name: string) {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings)) {
			throw new PermissionError('You do not have permission to change the name of this community');
		}
		this.props.name = new ValueObjects.Name(name).valueOf();
	}

	get domain(): string {
		return this.props.domain;
	}
	set domain(domain: string) {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings)) {
			throw new PermissionError('You do not have permission to change the domain of this community');
		}
		const oldDomain = this.props.domain;
		if (this.props.domain !== domain) {
			this.props.domain = new ValueObjects.Domain(domain).valueOf();
			this.addIntegrationEvent<CommunityDomainUpdatedProps, CommunityDomainUpdatedEvent>(CommunityDomainUpdatedEvent, {
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
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings)) {
			throw new PermissionError('You do not have permission to change the white label domain of this community');
		}
		const oldWhiteLabelDomain = this.props.whiteLabelDomain;
		this.props.whiteLabelDomain = new ValueObjects.WhiteLabelDomain(whiteLabelDomain).valueOf();
		if (oldWhiteLabelDomain !== this.props.whiteLabelDomain && this.props.whiteLabelDomain !== null) {
			this.addIntegrationEvent<CommunityWhiteLabelDomainUpdatedProps, CommunityWhiteLabelDomainUpdatedEvent>(CommunityWhiteLabelDomainUpdatedEvent, {
				communityId: this.props.id,
				whiteLabelDomain: this.props.whiteLabelDomain,
				oldWhiteLabelDomain: oldWhiteLabelDomain,
			});
		}
	}

	get handle(): string | null {
		return this.props.handle;
	}
	set handle(handle: string | null) {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings)) {
			throw new PermissionError('You do not have permission to change the handle of this community');
		}
		this.props.handle = new ValueObjects.Handle(handle).valueOf();
	}

	get createdBy(): EndUserEntityReference {
		return new EndUser(this.props.createdBy, this.passport);
	}

	private set createdBy(createdBy: EndUserEntityReference | null | undefined) {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings)) {
			throw new PermissionError('You do not have permission to change the created by of this community');
		}
		if (createdBy === null || createdBy === undefined) {
			throw new PermissionError('createdBy cannot be null or undefined');
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

	/**
	 * The finance value object. Typed as props to satisfy {@link CommunityEntityReference},
	 * which mirrors {@link CommunityProps} because sibling aggregates (member, role,
	 * property) embed community props directly; narrowing it here would require
	 * untangling that props/reference conflation across those aggregates. GraphQL maps
	 * this field to CommunityFinanceEntityReference, which matches the runtime shape.
	 */
	get finance(): CommunityFinanceProps {
		return new CommunityFinance(this.props.finance, this.visa, this.isNew) as unknown as CommunityFinanceProps;
	}
	//#endregion Properties
}
