import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './community.value-objects.ts';
import { CommunityTransaction, type CommunityTransactionEntityReference, type CommunityTransactionProps } from './community-transaction.ts';

export interface CommunityFinanceProps extends ValueObjectProps {
	subscriptionTier: string;
	paymentInstrumentId: string | null;
	readonly transactions: PropArray<CommunityTransactionProps>;
}

export interface CommunityFinanceEntityReference extends Readonly<Omit<CommunityFinanceProps, 'transactions'>> {
	readonly transactions: ReadonlyArray<CommunityTransactionEntityReference>;
}

export class CommunityFinance extends ValueObject<CommunityFinanceProps> implements CommunityFinanceEntityReference {
	private readonly visa: CommunityVisa;
	private readonly isNew: boolean;

	constructor(props: CommunityFinanceProps, visa: CommunityVisa, isNew = false) {
		super(props);
		this.visa = visa;
		this.isNew = isNew;
	}

	private validateVisa(): void {
		if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings || domainPermissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to change billing settings for this community');
		}
	}

	get subscriptionTier(): string {
		return this.props.subscriptionTier;
	}
	set subscriptionTier(subscriptionTier: string) {
		this.validateVisa();
		this.props.subscriptionTier = new ValueObjects.SubscriptionTier(subscriptionTier).valueOf() as string;
	}

	get paymentInstrumentId(): string | null {
		return this.props.paymentInstrumentId;
	}
	set paymentInstrumentId(paymentInstrumentId: string | null) {
		this.validateVisa();
		this.props.paymentInstrumentId = new ValueObjects.PaymentInstrumentId(paymentInstrumentId).valueOf();
	}

	get transactions(): CommunityTransaction[] {
		return this.props.transactions.items.map((item) => new CommunityTransaction(item, this.visa));
	}

	public requestNewTransaction(): CommunityTransaction {
		this.validateVisa();
		return new CommunityTransaction(this.props.transactions.getNewItem(), this.visa);
	}
}
