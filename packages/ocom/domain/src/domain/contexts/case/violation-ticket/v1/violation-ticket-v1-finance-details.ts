import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference } from './violation-ticket-v1-finance-details-revenue-recognition.ts';
import type { ViolationTicketV1FinanceDetailsTransactionsEntityReference } from './violation-ticket-v1-finance-details-transactions.ts';

export interface ViolationTicketV1FinanceDetailProps extends ValueObjectProps {
	serviceFee: number;
	transactions: ViolationTicketV1FinanceDetailsTransactionsEntityReference;
	revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference;
}

export interface ViolationTicketV1FinanceDetailEntityReference
	extends Readonly<
		Omit<
			ViolationTicketV1FinanceDetailProps,
			'transactions' | 'revenueRecognition'
		>
	> {
	readonly transactions: ViolationTicketV1FinanceDetailsTransactionsEntityReference;
	readonly revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference;
}

export class ViolationTicketV1FinanceDetails
	extends ValueObject<ViolationTicketV1FinanceDetailProps>
	implements ViolationTicketV1FinanceDetailEntityReference
{
	get serviceFee(): number {
		return this.props.serviceFee;
	}

	set serviceFee(value: number) {
		this.props.serviceFee = value;
	}

	get transactions(): ViolationTicketV1FinanceDetailsTransactionsEntityReference {
		return this.props.transactions;
	}

	get revenueRecognition(): ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference {
		return this.props.revenueRecognition;
	}
}
