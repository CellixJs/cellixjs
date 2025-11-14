import type { ValueObject, ValueObjectProps } from '@cellix/domain-seedwork/value-object';
export interface ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalProps extends ValueObjectProps {
  isApplicantApprovalRequired: boolean;
  isApplicantApproved: boolean;
  applicantRespondedAt: Date;
}

export interface ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference extends Readonly<
  ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalProps
> {}

export class ViolationTicketV1FinanceDetailsAdhocTransactionsApproval extends ValueObject<ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalProps>
  implements ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference
{
  get isApplicantApprovalRequired(): boolean {
    return this.props.isApplicantApprovalRequired;
  }

  set isApplicantApprovalRequired(value: boolean) {
    this.props.isApplicantApprovalRequired = value;
  }

  get isApplicantApproved(): boolean {
    return this.props.isApplicantApproved;
  }

  set isApplicantApproved(value: boolean) {
    this.props.isApplicantApproved = value;
  }

  get applicantRespondedAt(): Date {
    return this.props.applicantRespondedAt;
  }

  set applicantRespondedAt(value: Date) {
    this.props.applicantRespondedAt = value;
  }
}