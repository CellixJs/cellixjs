import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceEntityReference } from './violation-ticket-v1-finance-details-transactions-submission-transaction-reference.ts';

export interface ViolationTicketV1FinanceDetailsTransactionsSubmissionProps
	extends DomainSeedwork.ValueObjectProps {
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
	extends DomainSeedwork.ValueObject<ViolationTicketV1FinanceDetailsTransactionsSubmissionProps>
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
