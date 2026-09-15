import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './community-config.value-objects.ts';

export interface CommunityConfigSubscriptionProps extends ValueObjectProps {
	pricePerMember: number;
	currency: string;
}

export interface CommunityConfigSubscriptionEntityReference extends Readonly<CommunityConfigSubscriptionProps> {}

export class CommunityConfigSubscription extends ValueObject<CommunityConfigSubscriptionProps> implements CommunityConfigSubscriptionEntityReference {
	private readonly visa: CommunityVisa;
	private readonly isNew: boolean;

	constructor(props: CommunityConfigSubscriptionProps, visa: CommunityVisa, isNew = false) {
		super(props);
		this.visa = visa;
		this.isNew = isNew;
	}

	private validateVisa(): void {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to change community configuration');
		}
	}

	get pricePerMember(): number {
		return this.props.pricePerMember;
	}
	set pricePerMember(pricePerMember: number) {
		this.validateVisa();
		this.props.pricePerMember = new ValueObjects.PricePerMember(pricePerMember).valueOf();
	}

	get currency(): string {
		return this.props.currency;
	}
	set currency(currency: string) {
		this.validateVisa();
		this.props.currency = new ValueObjects.Currency(currency).valueOf();
	}
}
