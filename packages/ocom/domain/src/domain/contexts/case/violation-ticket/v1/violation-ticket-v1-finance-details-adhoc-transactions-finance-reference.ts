import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
export interface ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceProps
	extends ValueObjectProps {
	debitGlAccount: string;
	creditGlAccount: string;
	completedOn: Date;
}

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference
	extends Readonly<ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceProps> {}

export class ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference
	extends ValueObject<ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceProps>
	implements
		ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference
{
	get debitGlAccount(): string {
		return this.props.debitGlAccount;
	}

	set debitGlAccount(value: string) {
		this.props.debitGlAccount = value;
	}

	get creditGlAccount(): string {
		return this.props.creditGlAccount;
	}

	set creditGlAccount(value: string) {
		this.props.creditGlAccount = value;
	}

	get completedOn(): Date {
		return this.props.completedOn;
	}

	set completedOn(value: Date) {
		this.props.completedOn = value;
	}
}
