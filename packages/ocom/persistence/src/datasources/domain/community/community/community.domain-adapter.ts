import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Community, CommunityFinance, CommunityTransaction } from '@ocom/data-sources-mongoose-models/community';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';
import { Domain } from '@ocom/domain';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';

export class CommunityConverter extends MongooseSeedwork.MongoTypeConverter<Community, CommunityDomainAdapter, Domain.Passport, Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>> {
	constructor() {
		super(CommunityDomainAdapter, Domain.Contexts.Community.Community.Community);
	}
}

export class CommunityDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<Community> implements Domain.Contexts.Community.Community.CommunityProps {
	get name() {
		return this.doc.name;
	}
	set name(name) {
		this.doc.name = name;
	}

	get domain() {
		return this.doc.domain;
	}
	set domain(domain) {
		this.doc.domain = domain;
	}

	get whiteLabelDomain() {
		return this.doc.whiteLabelDomain;
	}
	set whiteLabelDomain(whiteLabelDomain: string) {
		this.doc.whiteLabelDomain = whiteLabelDomain;
	}

	get handle() {
		return this.doc.handle;
	}
	set handle(handle) {
		this.doc.handle = handle;
	}

	get createdBy(): Domain.Contexts.User.EndUser.EndUserProps {
		if (!this.doc.createdBy) {
			throw new Error('createdBy is not populated');
		}
		if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
			return { id: this.doc.createdBy.toString() } as Domain.Contexts.User.EndUser.EndUserEntityReference;
		}
		return new EndUserDomainAdapter(this.doc.createdBy as EndUser);
	}

	async loadCreatedBy(): Promise<Domain.Contexts.User.EndUser.EndUserProps> {
		if (!this.doc.createdBy) {
			throw new Error('createdBy is not populated');
		}
		if (this.doc.createdBy instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('createdBy');
		}
		return new EndUserDomainAdapter(this.doc.createdBy as EndUser);
	}

	set createdBy(user: Domain.Contexts.User.EndUser.EndUserEntityReference | Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>) {
		//check to see if user is derived from MongooseDomainAdapter
		if (user instanceof Domain.Contexts.User.EndUser.EndUser) {
			this.doc.set('createdBy', user.props.doc);
			return;
		}

		if (!user?.id) {
			throw new Error('user reference is missing id');
		}

		this.doc.set('createdBy', user);
	}

	get finance(): Domain.Contexts.Community.Community.CommunityFinanceProps {
		if (!this.doc.finance) {
			if (typeof this.doc.set === 'function') {
				this.doc.set('finance', { subscriptionTier: 'pro', transactions: [] });
			} else {
				(this.doc as { finance: CommunityFinance }).finance = { subscriptionTier: 'pro', transactions: [] } as unknown as CommunityFinance;
			}
		}
		return new CommunityFinanceDomainAdapter(this.doc.finance);
	}
}

class CommunityFinanceDomainAdapter implements Domain.Contexts.Community.Community.CommunityFinanceProps {
	public readonly props: CommunityFinance;
	constructor(props: CommunityFinance) {
		this.props = props;
	}

	get subscriptionTier() {
		return this.props.subscriptionTier ?? 'pro';
	}
	set subscriptionTier(subscriptionTier: string) {
		this.props.subscriptionTier = subscriptionTier as CommunityFinance['subscriptionTier'];
	}

	get paymentInstrumentId(): string | null {
		return this.props.paymentInstrumentId ?? null;
	}
	set paymentInstrumentId(paymentInstrumentId: string | null) {
		if (paymentInstrumentId === null) {
			delete (this.props as { paymentInstrumentId?: string }).paymentInstrumentId;
			return;
		}
		this.props.paymentInstrumentId = paymentInstrumentId;
	}

	get transactions(): PropArray<Domain.Contexts.Community.Community.CommunityTransactionProps> {
		if (!this.props.transactions) {
			(this.props as { transactions: CommunityTransaction[] }).transactions = [];
		}
		return new MongooseSeedwork.MongoosePropArray(this.props.transactions, CommunityTransactionDomainAdapter);
	}
}

class CommunityTransactionDomainAdapter implements Domain.Contexts.Community.Community.CommunityTransactionProps {
	public readonly doc: CommunityTransaction;
	constructor(doc: CommunityTransaction) {
		this.doc = doc;
	}

	public get id(): string {
		return this.doc._id?.toString() as string;
	}

	get amount() {
		return this.doc.amount;
	}
	set amount(amount: number) {
		this.doc.amount = amount;
	}

	get transactionReference() {
		return this.doc.transactionReference ?? {};
	}
	set transactionReference(transactionReference: Domain.Contexts.Community.Community.CommunityTransactionReferenceProps) {
		this.doc.transactionReference = transactionReference as CommunityTransaction['transactionReference'];
	}

	get createdAt() {
		return this.doc.createdAt;
	}

	get updatedAt() {
		return this.doc.updatedAt;
	}
}
