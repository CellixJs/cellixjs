import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
export interface ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceProps
	extends ValueObjectProps {
	referenceId: string;
	completedOn: Date;
	vendor: string;
}

export interface ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference
	extends Readonly<ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceProps> {}

export class ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference
	extends ValueObject<ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceProps>
	implements
		ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference
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
