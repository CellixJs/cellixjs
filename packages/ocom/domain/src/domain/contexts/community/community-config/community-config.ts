import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { Passport } from '../../passport.ts';
import type { CommunityEntityReference } from '../community/community.ts';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './community-config.value-objects.ts';
import { CommunityConfigLimits, type CommunityConfigLimitsEntityReference, type CommunityConfigLimitsProps } from './community-config-limits.ts';
import { CommunityConfigSubscription, type CommunityConfigSubscriptionEntityReference, type CommunityConfigSubscriptionProps } from './community-config-subscription.ts';

/**
 * CommunityConfig is global, system-managed configuration; it has no owning community.
 * Passing the config's own id as a community id would describe a community that does not
 * exist. The system passport — the only one that can satisfy the system-account check
 * below — ignores this root, and every other passport denies regardless.
 */
const NO_OWNING_COMMUNITY = { id: '' } as CommunityEntityReference;

export interface CommunityConfigProps extends DomainEntityProps {
	subscriptionTier: string;
	readonly subscription: CommunityConfigSubscriptionProps;
	readonly limits: CommunityConfigLimitsProps;
	effectiveDate: Date;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface CommunityConfigEntityReference extends Readonly<Omit<CommunityConfigProps, 'subscription' | 'limits'>> {
	readonly subscription: CommunityConfigSubscriptionEntityReference;
	readonly limits: CommunityConfigLimitsEntityReference;
}

export class CommunityConfig<props extends CommunityConfigProps> extends AggregateRoot<props, Passport> implements CommunityConfigEntityReference {
	private isNew = false;
	private readonly visa: CommunityVisa;

	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.community.forCommunity(NO_OWNING_COMMUNITY);
	}

	public static getNewInstance<props extends CommunityConfigProps>(
		newProps: props,
		subscriptionTier: string,
		pricePerMember: number,
		currency: string,
		maxMembers: number,
		maxAdmins: number,
		effectiveDate: Date,
		passport: Passport,
	): CommunityConfig<props> {
		const instance = new CommunityConfig(newProps, passport);
		instance.isNew = true;
		instance.subscriptionTier = subscriptionTier;
		instance.subscription.pricePerMember = pricePerMember;
		instance.subscription.currency = currency;
		instance.limits.maxMembers = maxMembers;
		instance.limits.maxAdmins = maxAdmins;
		instance.effectiveDate = effectiveDate;
		instance.isNew = false;
		return instance;
	}

	private validateVisa(): void {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to change community configuration');
		}
	}

	get subscriptionTier(): string {
		return this.props.subscriptionTier;
	}
	set subscriptionTier(subscriptionTier: string) {
		this.validateVisa();
		this.props.subscriptionTier = new ValueObjects.SubscriptionTier(subscriptionTier).valueOf() as string;
	}

	get subscription(): CommunityConfigSubscription {
		return new CommunityConfigSubscription(this.props.subscription, this.visa, this.isNew);
	}

	get limits(): CommunityConfigLimits {
		return new CommunityConfigLimits(this.props.limits, this.visa, this.isNew);
	}

	get effectiveDate(): Date {
		return this.props.effectiveDate;
	}
	set effectiveDate(effectiveDate: Date) {
		this.validateVisa();
		this.props.effectiveDate = effectiveDate;
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
