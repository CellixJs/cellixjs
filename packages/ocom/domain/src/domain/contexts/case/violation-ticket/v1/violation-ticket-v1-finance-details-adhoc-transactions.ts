import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions-approval.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions-finance-reference.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions-transaction-reference.ts';

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsProps extends DomainSeedwork.DomainEntityProps {
  amount: number;
  requestedBy: string; // Member ID reference
  requestedOn: Date;
  reason: string;
  approval: ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference;
  transactionReference: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference;
  financeReference: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference extends Readonly<
  Omit<ViolationTicketV1FinanceDetailsAdhocTransactionsProps, 'approval' | 'transactionReference' | 'financeReference'>
> {
  readonly approval: ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference;
  readonly transactionReference: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference;
  readonly financeReference: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference;
}

export class ViolationTicketV1FinanceDetailsAdhocTransactions extends DomainSeedwork.DomainEntity<ViolationTicketV1FinanceDetailsAdhocTransactionsProps>
  implements ViolationTicketV1FinanceDetailsAdhocTransactionsEntityReference
{
  private readonly visa: ViolationTicketV1Visa;

  constructor(props: ViolationTicketV1FinanceDetailsAdhocTransactionsProps, visa: ViolationTicketV1Visa) {
    super(props);
    this.visa = visa;
  }

  get amount(): number {
    return this.props.amount;
  }

  set amount(value: number) {
    if (!this.visa.determineIf(permissions => permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update adhoc transaction amount');
    }
    this.props.amount = value;
  }

  get requestedBy(): string {
    return this.props.requestedBy;
  }

  set requestedBy(value: string) {
    if (!this.visa.determineIf(permissions => permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update requested by');
    }
    this.props.requestedBy = value;
  }

  get requestedOn(): Date {
    return this.props.requestedOn;
  }

  set requestedOn(value: Date) {
    if (!this.visa.determineIf(permissions => permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update requested on');
    }
    this.props.requestedOn = value;
  }

  get reason(): string {
    return this.props.reason;
  }

  set reason(value: string) {
    if (!this.visa.determineIf(permissions => permissions.canManageTickets)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update reason');
    }
    this.props.reason = value;
  }

  get approval(): ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference {
    return this.props.approval;
  }

  get transactionReference(): ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference {
    return this.props.transactionReference;
  }

  get financeReference(): ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference {
    return this.props.financeReference;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}