import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference } from './violation-ticket-v1-finance-details-transactions-submission-transaction-reference.ts';

export interface ViolationTicketV1FinanceDetailsTransactionsSubmissionProps
	extends ValueObjectProps {
	amount: number;
	transactionReference: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference;
}

export interface ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference
	extends Readonly<
		Omit<
			ViolationTicketV1FinanceDetailsTransactionsSubmissionProps,
			'transactionReference'
		>
	> {
	readonly transactionReference: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference;
}

export class ViolationTicketV1FinanceDetailsTransactionsSubmission
	extends ValueObject<ViolationTicketV1FinanceDetailsTransactionsSubmissionProps>
	implements
		ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference
{
	get amount(): number {
		return this.props.amount;
	}

	set amount(value: number) {
		this.props.amount = value;
	}

	get transactionReference(): ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference {
		return this.props.transactionReference;
	}
}
