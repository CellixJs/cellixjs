import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CommunityConfig, CommunityConfigLimits, CommunityConfigSubscription } from '@ocom/data-sources-mongoose-models/community/community-config';
import { Domain } from '@ocom/domain';

export class CommunityConfigConverter extends MongooseSeedwork.MongoTypeConverter<
	CommunityConfig,
	CommunityConfigDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Community.CommunityConfig.CommunityConfig<CommunityConfigDomainAdapter>
> {
	constructor() {
		super(CommunityConfigDomainAdapter, Domain.Contexts.Community.CommunityConfig.CommunityConfig);
	}
}

export class CommunityConfigDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<CommunityConfig> implements Domain.Contexts.Community.CommunityConfig.CommunityConfigProps {
	get subscriptionTier() {
		return this.doc.subscriptionTier;
	}
	set subscriptionTier(subscriptionTier: string) {
		this.doc.subscriptionTier = subscriptionTier as CommunityConfig['subscriptionTier'];
	}

	get subscription() {
		if (!this.doc.subscription) {
			if (typeof this.doc.set === 'function') {
				this.doc.set('subscription', {});
			} else {
				(this.doc as { subscription: CommunityConfigSubscription }).subscription = {} as CommunityConfigSubscription;
			}
		}
		return new CommunityConfigSubscriptionDomainAdapter(this.doc.subscription);
	}

	get limits() {
		if (!this.doc.limits) {
			if (typeof this.doc.set === 'function') {
				this.doc.set('limits', {});
			} else {
				(this.doc as { limits: CommunityConfigLimits }).limits = {} as CommunityConfigLimits;
			}
		}
		return new CommunityConfigLimitsDomainAdapter(this.doc.limits);
	}

	get effectiveDate() {
		return this.doc.effectiveDate;
	}
	set effectiveDate(effectiveDate: Date) {
		this.doc.effectiveDate = effectiveDate;
	}
}

class CommunityConfigSubscriptionDomainAdapter implements Domain.Contexts.Community.CommunityConfig.CommunityConfigSubscriptionProps {
	public readonly props: CommunityConfigSubscription;
	constructor(props: CommunityConfigSubscription) {
		this.props = props;
	}

	get pricePerMember() {
		return this.props.pricePerMember;
	}
	set pricePerMember(pricePerMember: number) {
		this.props.pricePerMember = pricePerMember;
	}

	get currency() {
		return this.props.currency;
	}
	set currency(currency: string) {
		this.props.currency = currency;
	}
}

class CommunityConfigLimitsDomainAdapter implements Domain.Contexts.Community.CommunityConfig.CommunityConfigLimitsProps {
	public readonly props: CommunityConfigLimits;
	constructor(props: CommunityConfigLimits) {
		this.props = props;
	}

	get maxMembers() {
		return this.props.maxMembers;
	}
	set maxMembers(maxMembers: number) {
		this.props.maxMembers = maxMembers;
	}

	get maxAdmins() {
		return this.props.maxAdmins;
	}
	set maxAdmins(maxAdmins: number) {
		this.props.maxAdmins = maxAdmins;
	}
}
