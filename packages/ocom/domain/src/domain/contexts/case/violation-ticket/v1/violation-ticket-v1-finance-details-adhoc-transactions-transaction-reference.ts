import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
export interface ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps
	extends ValueObjectProps {
	referenceId: string;
	completedOn: Date;
	vendor: string;
}

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference
	extends Readonly<ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps> {}

export class ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference
	extends ValueObject<ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps>
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
