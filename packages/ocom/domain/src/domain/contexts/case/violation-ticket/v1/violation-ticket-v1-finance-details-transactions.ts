import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { ViolationTicketV1FinanceDetailsAdhocTransactions, type ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions.ts';
import type { ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference } from './violation-ticket-v1-finance-details-transactions-submission.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';

export interface ViolationTicketV1FinanceDetailsTransactionsProps extends DomainSeedwork.ValueObjectProps {
  submission: ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference;
  adhocTransactions: DomainSeedwork.PropArray<ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference>;
}

export interface ViolationTicketV1FinanceDetailsTransactionsEntityReference extends Readonly<
  Omit<ViolationTicketV1FinanceDetailsTransactionsProps, 'submission' | 'adhocTransactions'>
> {
  readonly submission: ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference;
  readonly adhocTransactions: ReadonlyArray<ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference>;
}

export class ViolationTicketV1FinanceDetailsTransactions extends DomainSeedwork.ValueObject<ViolationTicketV1FinanceDetailsTransactionsProps>
  implements ViolationTicketV1FinanceDetailsTransactionsEntityReference
{

    private readonly visa: ViolationTicketV1Visa;
    constructor(props: ViolationTicketV1FinanceDetailsTransactionsProps, visa: ViolationTicketV1Visa) {
      super(props);
      this.visa = visa;
    }

  get submission(): ViolationTicketV1FinanceDetailsTransactionsSubmissionEntityReference {
    return this.props.submission;
  }

  get adhocTransactions(): ReadonlyArray<ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference> {
    return this.props.adhocTransactions.items;
  }

  public requestAddNewAdhocTransaction(): ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference {
    const adhocTransaction = this.props.adhocTransactions.getNewItem();
    return new ViolationTicketV1FinanceDetailsAdhocTransactions(adhocTransaction, this.visa);
  }
}
