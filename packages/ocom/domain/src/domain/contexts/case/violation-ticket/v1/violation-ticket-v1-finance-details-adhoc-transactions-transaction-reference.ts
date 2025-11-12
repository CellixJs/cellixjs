import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps
	extends DomainSeedwork.ValueObjectProps {
	referenceId: string;
	completedOn: Date;
	vendor: string;
}

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference
	extends Readonly<ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps> {}

export class ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference
	extends DomainSeedwork.ValueObject<ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps>
	implements
		ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference
{
	get referenceId(): string {
		return this.props.referenceId;
	}

	get completedOn(): Date {
		return this.props.completedOn;
	}

	get vendor(): string {
		return this.props.vendor;
	}
}
