import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ViolationTicketV1FinanceDetailsTransactionsEntityReference } from './violation-ticket-v1-finance-details-transactions.ts';
import type { ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference } from './violation-ticket-v1-finance-details-revenue-recognition.ts';

export interface ViolationTicketV1FinanceDetailProps extends DomainSeedwork.ValueObjectProps {
  serviceFee: number;
  transactions: ViolationTicketV1FinanceDetailsTransactionsEntityReference;
  revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference;
}

export interface ViolationTicketV1FinanceDetailEntityReference extends Readonly<
  Omit<ViolationTicketV1FinanceDetailProps, 'transactions' | 'revenueRecognition'>
> {
  readonly transactions: ViolationTicketV1FinanceDetailsTransactionsEntityReference;
  readonly revenueRecognition: ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference;
}

export class ViolationTicketV1FinanceDetails extends DomainSeedwork.ValueObject<ViolationTicketV1FinanceDetailProps>
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